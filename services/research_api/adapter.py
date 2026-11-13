"""Adapter for executing domain loop simulations and returning normalized event traces."""

from typing import Any, Dict, List, Optional
import json
from pathlib import Path
import sys
import numpy as np

CURRENT_DIR = Path(__file__).resolve().parent

# Check local sim_engine first for standalone operation
SIM_ENGINE_DIR = CURRENT_DIR / "sim_engine"
if SIM_ENGINE_DIR.exists():
    if str(SIM_ENGINE_DIR) not in sys.path:
        sys.path.insert(0, str(SIM_ENGINE_DIR))
    from domain_loop_simulator import LoopEnvironment, calibrate
    from domain_loop_data import load_cases, chronological_split
else:
    # Fallback to monorepo parent paths
    found = False
    for parent in CURRENT_DIR.parents:
        if (parent / "src").exists():
            if str(parent) not in sys.path:
                sys.path.insert(0, str(parent))
            from src.domain_loop_simulator import LoopEnvironment, calibrate
            from src.domain_loop_data import load_cases, chronological_split
            found = True
            break
    if not found:
        raise ImportError("Cannot locate domain_loop_simulator or domain_loop_data engine.")

# Cache calibrated laws by domain to avoid refitting repeatedly
_CACHED_LAWS: Dict[str, Any] = {}
_CACHED_SPECS: Dict[str, Any] = {}
_CONFIG: Optional[Dict[str, Any]] = None


def get_config_and_spec(domain_key: str):
    global _CONFIG, _CACHED_SPECS
    if _CONFIG is None:
        local_cfg = CURRENT_DIR / "sim_engine" / "domain_loop_simulations.json"
        if local_cfg.exists():
            _CONFIG = json.loads(local_cfg.read_text(encoding="utf-8"))
        else:
            for parent in CURRENT_DIR.parents:
                cfg_path = parent / "configs" / "domain_loop_simulations.json"
                if cfg_path.exists():
                    _CONFIG = json.loads(cfg_path.read_text(encoding="utf-8"))
                    break
        if _CONFIG is None:
            raise FileNotFoundError("domain_loop_simulations.json could not be found.")
    spec = _CONFIG["domains"].get(domain_key, _CONFIG["domains"]["insurance"])
    return _CONFIG, spec


def get_calibrated_law(domain_key: str):
    global _CACHED_LAWS
    if domain_key in _CACHED_LAWS:
        return _CACHED_LAWS[domain_key]

    cfg, spec = get_config_and_spec(domain_key)

    # 1. Check local data directory inside services/research_api/data
    source_filename = Path(spec["source_path"]).name
    candidate_local = CURRENT_DIR / "data" / source_filename

    source_path = None
    if candidate_local.exists():
        source_path = candidate_local
    else:
        # Check monorepo parent paths
        for parent in CURRENT_DIR.parents:
            p = parent / spec["source_path"]
            if p.exists():
                source_path = p
                break

    if source_path is None or not source_path.exists():
        source_path = candidate_local

    cases, _ = load_cases(source_path, domain_key, spec)
    fit, _, _, _ = chronological_split(cases, cfg["fit_fraction"])
    law = calibrate(fit, spec, cfg)
    _CACHED_LAWS[domain_key] = law
    return law


def run_bounded_simulation(
    domain: str = "SimClaims",
    num_cases: int = 15,
    seed: int = 42,
    effect: float = 0.25,
) -> Dict[str, Any]:
    domain_key = "insurance"
    if domain.lower() in ("bpisim", "bpi"):
        domain_key = "bpisim"
    elif domain.lower() in ("simfactory", "manufacturing", "factory"):
        domain_key = "manufacturing"

    cfg, spec = get_config_and_spec(domain_key)
    law = get_calibrated_law(domain_key)

    arrivals = np.linspace(0.0, num_cases * 15.0, num_cases)

    # 1. Baseline Run: Standard Routing (FIFO)
    env_base = LoopEnvironment(law, spec, cfg, effect=effect, scenario=True)
    obs = env_base.reset(arrivals=arrivals, seed=seed)
    done = False
    while not done:
        obs, _, done, _ = env_base.step("standard")

    # 2. Candidate Run: Congestion-Aware Routing (Specialist on repeat when queue allows)
    env_cand = LoopEnvironment(law, spec, cfg, effect=effect, scenario=True)
    obs = env_cand.reset(arrivals=arrivals, seed=seed)
    done = False
    while not done:
        action = "standard"
        if obs.attempt > 1 and obs.specialist_jobs <= obs.standard_jobs:
            action = "specialist"
        obs, _, done, _ = env_cand.step(action)

    def summarize_records(records):
        queues = [max(0.0, r.service_start - r.ready) for r in records]
        attempts = len(records)
        return {
            "mean_queue": float(np.mean(queues)) if queues else 0.0,
            "total_attempts": attempts,
            "attempts_per_case": attempts / num_cases,
        }

    m_base = summarize_records(env_base.records)
    m_cand = summarize_records(env_cand.records)

    base_q = m_base["mean_queue"]
    cand_q = m_cand["mean_queue"]
    gain = base_q - cand_q
    pct_gain = (100.0 * gain / base_q) if base_q > 0 else 0.0

    # Build event trace for case 0 candidate run
    trace: List[Dict[str, Any]] = []
    case_0_records = [r for r in env_cand.records if r.case == 0]
    for r in case_0_records:
        trace.append({
            "caseId": r.case,
            "attempt": r.attempt,
            "action": r.action,
            "readyTime": round(r.ready, 2),
            "serviceStartTime": round(r.service_start, 2),
            "serviceEndTime": round(r.service_end, 2),
            "endTime": round(r.end, 2),
            "outcome": r.outcome,
            "queueTime": round(max(0.0, r.service_start - r.ready), 2),
            "milestoneTime": round(r.milestone_time, 2) if r.milestone_time else None,
        })

    return {
        "domain": domain,
        "casesEvaluated": num_cases,
        "seed": seed,
        "control": {
            "name": "Standard FIFO Baseline",
            "meanQueue": round(base_q, 2),
            "totalAttempts": m_base["total_attempts"],
        },
        "candidate": {
            "name": "Congestion-Aware Policy Search",
            "meanQueue": round(cand_q, 2),
            "totalAttempts": m_cand["total_attempts"],
        },
        "signedGainMinutes": round(gain, 2),
        "percentageGain": round(pct_gain, 2),
        "caseZeroTrace": trace,
    }
