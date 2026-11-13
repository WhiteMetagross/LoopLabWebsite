"""Export canonical website result manifest from audited runs."""

from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sys

import numpy as np


def compute_sha256(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    repo_root = Path(__file__).resolve().parents[2]
    runs_dir = repo_root / "runs"
    report_dir = repo_root / "report" / "paper_figures"
    out_dir = repo_root / "LoopLabProject" / "web" / "public" / "research"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "paper_results.v1.json"

    # Source files
    core_path = runs_dir / "paper_suite_full_20261104" / "aggregate.json"
    regression_path = runs_dir / "regression_ablation_full_20261112" / "results.json"
    artifacts_path = report_dir / "regression_paper_artifacts.json"

    core_data = load_json(core_path)
    regression_data = load_json(regression_path)
    artifacts_data = load_json(artifacts_path)

    source_hashes = {
        "paper_suite_full_20261104": compute_sha256(core_path),
        "regression_ablation_full_20261112": compute_sha256(regression_path),
        "regression_paper_artifacts": compute_sha256(artifacts_path),
    }

    seeds = regression_data["seeds"]
    domains = regression_data["domains"]
    claims = domains["insurance"]
    bpi = domains["bpisim"]
    factory = domains["manufacturing"]
    bank = domains["simbank"]

    # Bank direct comparison from regression_paper_artifacts
    bank_direct = artifacts_data["bank_direct_comparison"]

    def extract_effect(comparison, field, scale=1.0, direction=-1.0):
        val = direction * scale * float(comparison["mean"][field])
        raw_ci = direction * scale * np.asarray(comparison["paired_ci95"][field], dtype=float)
        return float(val), [float(raw_ci.min()), float(raw_ci.max())]

    # SimClaims focused comparison
    claims_gain_val, claims_gain_ci = extract_effect(
        claims["comparisons"]["full_minus_supervised_ML"], "queue"
    )
    claims_rep_val, claims_rep_ci = extract_effect(
        claims["comparisons"]["full_minus_supervised_ML"], "extra_attempts", scale=100.0, direction=1.0
    )
    claims_control_mean = float(claims["policies"]["full_ML"]["mean"]["queue"])
    claims_candidate_mean = float(claims["policies"]["full"]["mean"]["queue"])
    claims_pct_gain = 100.0 * (claims_control_mean - claims_candidate_mean) / claims_control_mean

    # BPISim focused comparison
    bpi_gain_val, bpi_gain_ci = extract_effect(
        bpi["comparisons"]["marker_forced_minus_ML"], "elapsed"
    )
    bpi_rep_val, bpi_rep_ci = extract_effect(
        bpi["comparisons"]["marker_forced_minus_ML"], "extra_attempts", scale=100.0, direction=-1.0
    )
    bpi_control_mean = float(bpi["policies"]["marker_ML"]["mean"]["elapsed"])
    bpi_candidate_mean = float(bpi["policies"]["marker_forced"]["mean"]["elapsed"])
    bpi_pct_gain = 100.0 * (bpi_control_mean - bpi_candidate_mean) / bpi_control_mean

    # SimFactory focused comparison
    factory_gain_val, factory_gain_ci = extract_effect(
        factory["comparisons"]["safe_075_minus_ML"], "tail_queue"
    )
    factory_rep_val, factory_rep_ci = extract_effect(
        factory["comparisons"]["safe_075_minus_ML"], "extra_attempts", scale=100.0, direction=1.0
    )
    factory_control_mean = float(factory["policies"]["ML"]["mean"]["tail_queue"])
    factory_candidate_mean = float(factory["policies"]["safe_075"]["mean"]["tail_queue"])
    factory_pct_gain = 100.0 * (factory_control_mean - factory_candidate_mean) / factory_control_mean

    # SimBank focused comparison
    bank_refusal_gain_val = -100.0 * float(bank_direct["refusals"]["difference"])
    bank_refusal_gain_ci = sorted([-100.0 * float(x) for x in bank_direct["refusals"]["ci95"]])
    bank_control_refusals = 100.0 * float(bank["policies"]["Regression_DP_500"]["mean"]["refusals"])
    bank_candidate_refusals = 100.0 * float(bank["policies"]["CQL_both"]["mean"]["refusals"])
    bank_pct_gain = 100.0 * (bank_control_refusals - bank_candidate_refusals) / bank_control_refusals
    bank_profit_diff = float(bank_direct["profit"]["difference"])
    bank_profit_ci = [float(x) for x in bank_direct["profit"]["ci95"]]

    focused_studies = {
        "SimClaims": {
            "domain": "insurance",
            "control": {
                "id": "full_ML",
                "label": "Regression",
                "description": "Task matched supervised regression predictor with static allocation.",
                "mean": claims_control_mean,
            },
            "candidate": {
                "id": "full",
                "label": "Regression with episodic policy search",
                "description": "Validation selected regression forecaster with episodic policy search and congestion state.",
                "mean": claims_candidate_mean,
            },
            "primaryMetric": {
                "id": "queue",
                "label": "Mean queue time",
                "unit": "minutes",
                "betterDirection": "lower",
                "controlMean": claims_control_mean,
                "candidateMean": claims_candidate_mean,
                "signedGain": claims_gain_val,
                "percentageGain": claims_pct_gain,
                "pairedCi95": claims_gain_ci,
            },
            "secondaryMetric": {
                "id": "extra_attempts",
                "label": "Extra attempts per 100 claims",
                "unit": "attempts/100",
                "betterDirection": "lower",
                "change": claims_rep_val,
                "pairedCi95": claims_rep_ci,
                "limit": 0.50,
                "limitStatus": "passes",
                "limitDescription": "Adds 0.322 attempts per 100 claims, remaining strictly below the 0.50 threshold.",
            },
            "evaluationCounts": {
                "seeds": len(seeds),
                "workloadsPerSeed": 384,
                "claimsPerWorkload": 250,
            },
            "selectionStatus": "selected",
            "findingSummary": "Reduces mean queue time from 55.85 to 49.56 minutes per claim (11.25 percent saving). Adds 0.322 document request attempts per 100 claims, below the declared limit.",
        },
        "BPISim": {
            "domain": "bpisim",
            "control": {
                "id": "marker_ML",
                "label": "Regression",
                "description": "Validation selected regression predictor acting at review marker.",
                "mean": bpi_control_mean,
            },
            "candidate": {
                "id": "marker_forced",
                "label": "Forced episodic policy search",
                "description": "Forced episodic controller acting at review marker.",
                "mean": bpi_candidate_mean,
            },
            "primaryMetric": {
                "id": "elapsed",
                "label": "Total elapsed time",
                "unit": "minutes",
                "betterDirection": "lower",
                "controlMean": bpi_control_mean,
                "candidateMean": bpi_candidate_mean,
                "signedGain": bpi_gain_val,
                "percentageGain": bpi_pct_gain,
                "pairedCi95": bpi_gain_ci,
            },
            "secondaryMetric": {
                "id": "extra_attempts",
                "label": "Extra attempts per 100 applications",
                "unit": "attempts/100",
                "betterDirection": "lower",
                "change": bpi_rep_val,
                "pairedCi95": bpi_rep_ci,
                "limit": 0.50,
                "limitStatus": "inconclusive",
                "limitDescription": "Avoids 0.140 attempts per 100 applications, but interval crosses zero.",
            },
            "evaluationCounts": {
                "seeds": len(seeds),
                "workloadsPerSeed": 384,
                "applicationsPerWorkload": 250,
            },
            "selectionStatus": "forced_sensitivity",
            "findingSummary": "Total elapsed time changes from 8,974.01 to 8,963.69 minutes. Saving is 10.32 minutes with interval crossing zero. Validation retains Regression across all seeds.",
        },
        "SimFactory": {
            "domain": "manufacturing",
            "control": {
                "id": "ML",
                "label": "Regression",
                "description": "Standard supervised regression router.",
                "mean": factory_control_mean,
            },
            "candidate": {
                "id": "safe_075",
                "label": "Regression with safety constrained search",
                "description": "Regression forecaster with accrued waiting state and safety penalty.",
                "mean": factory_candidate_mean,
            },
            "primaryMetric": {
                "id": "tail_queue",
                "label": "Tail queue wait (8 longest in 80 jobs)",
                "unit": "minutes",
                "betterDirection": "lower",
                "controlMean": factory_control_mean,
                "candidateMean": factory_candidate_mean,
                "signedGain": factory_gain_val,
                "percentageGain": factory_pct_gain,
                "pairedCi95": factory_gain_ci,
            },
            "secondaryMetric": {
                "id": "extra_repairs",
                "label": "Extra repairs per 100 jobs",
                "unit": "repairs/100",
                "betterDirection": "lower",
                "change": factory_rep_val,
                "pairedCi95": factory_rep_ci,
                "limit": 0.50,
                "limitStatus": "unresolved",
                "limitDescription": "Mean is 0.405 which meets 0.50, but upper bound 0.551 exceeds threshold.",
            },
            "evaluationCounts": {
                "seeds": len(seeds),
                "workloadsPerSeed": 384,
                "jobsPerWorkload": 80,
            },
            "selectionStatus": "selected",
            "findingSummary": "Reduces tail queue time from 688.88 to 638.59 minutes (7.30 percent saving). Extra repairs increase by 0.405 per 100 jobs, with upper bound exceeding strict 0.50 limit.",
        },
        "SimBank": {
            "domain": "simbank",
            "control": {
                "id": "Regression_DP_500",
                "label": "Regression based dynamic planner",
                "description": "Dynamic program based on task matched regression refusal predictions.",
                "mean": bank_control_refusals,
            },
            "candidate": {
                "id": "CQL_both",
                "label": "Regression informed CQL",
                "description": "Conservative Q learning with regression features and process penalties for refusal and cancellation.",
                "mean": bank_candidate_refusals,
            },
            "primaryMetric": {
                "id": "refusals",
                "label": "Refusals per 100 negotiations",
                "unit": "refusals/100",
                "betterDirection": "lower",
                "controlMean": bank_control_refusals,
                "candidateMean": bank_candidate_refusals,
                "signedGain": bank_refusal_gain_val,
                "percentageGain": bank_pct_gain,
                "pairedCi95": bank_refusal_gain_ci,
            },
            "secondaryMetric": {
                "id": "profit",
                "label": "Native profit per case",
                "unit": "profit units",
                "betterDirection": "higher",
                "change": bank_profit_diff,
                "pairedCi95": bank_profit_ci,
                "limit": 0.0,
                "limitStatus": "inconclusive",
                "limitDescription": "Profit change is 6.92 units with interval spanning -67.93 to 93.57. Does not establish profit gain or loss.",
            },
            "evaluationCounts": {
                "seeds": len(seeds),
                "casesPerSeed": 30000,
            },
            "selectionStatus": "selected_with_tradeoff",
            "findingSummary": "Refusals decrease from 25.04 to 19.29 per 100 cases (22.95 percent reduction). Profit change is 6.92 units with 95 percent interval spanning -67.93 to 93.57.",
        },
    }

    # Ablation table items
    claims_comp = claims["comparisons"]
    factory_comp = factory["comparisons"]
    bank_comp = bank["comparisons"]

    def abl_entry(comp, field, scale=1.0, direction=-1.0):
        val, ci = extract_effect(comp, field, scale, direction)
        return {"value": val, "ci95": ci}

    marker_mean = bpi["policies"]["marker_ML"]["mean"]
    reviewer_share = 100.0 * (marker_mean["queue"] + marker_mean["work"]) / marker_mean["elapsed"]

    ablations = [
        {
            "domain": "SimClaims",
            "question": "Does search add to equal static tuning?",
            "comparison": "Full vs. equal static",
            "change": abl_entry(claims_comp["full_minus_equal_static"], "queue"),
            "unit": "queue min saved",
            "conclusion": "No confirmed residual gain.",
        },
        {
            "domain": "SimClaims",
            "question": "Is congestion state useful?",
            "comparison": "Full vs. no congestion",
            "change": abl_entry(claims_comp["full_minus_no_congestion"], "queue"),
            "unit": "queue min saved",
            "conclusion": "Congestion is essential.",
        },
        {
            "domain": "SimClaims",
            "question": "Do forecast residuals help?",
            "comparison": "Full vs. no forecast",
            "change": abl_entry(claims_comp["full_minus_no_forecast"], "queue"),
            "unit": "queue min saved",
            "conclusion": "Forecast residuals reduce queue performance.",
        },
        {
            "domain": "SimClaims",
            "question": "Do later repeat decisions help?",
            "comparison": "Full vs. first only",
            "change": abl_entry(claims_comp["full_minus_first_only"], "queue"),
            "unit": "queue min saved",
            "conclusion": "First only routing is better.",
        },
        {
            "domain": "BPISim",
            "question": "Does validation select search?",
            "comparison": "Selected vs. Regression",
            "change": abl_entry(bpi["comparisons"]["marker_selected_minus_ML"], "elapsed"),
            "unit": "elapsed min saved",
            "conclusion": "Regression is selected for all seeds.",
        },
        {
            "domain": "BPISim",
            "question": "Can forced search improve elapsed time?",
            "comparison": "Forced vs. Regression",
            "change": abl_entry(bpi["comparisons"]["marker_forced_minus_ML"], "elapsed"),
            "unit": "elapsed min saved",
            "conclusion": "The gain is not confirmed.",
        },
        {
            "domain": "BPISim",
            "question": "How much elapsed time can review affect?",
            "comparison": "Review queue and work share",
            "change": {"value": reviewer_share, "ci95": [reviewer_share, reviewer_share]},
            "unit": "percent of elapsed time",
            "conclusion": "Most elapsed time is outside the decision.",
        },
        {
            "domain": "SimFactory",
            "question": "Does accrued waiting state help?",
            "comparison": "Safe vs. no accrued wait",
            "change": abl_entry(factory_comp["safe_075_minus_no_accrued_wait"], "tail_queue"),
            "unit": "tail min saved",
            "conclusion": "Accrued wait is useful.",
        },
        {
            "domain": "SimFactory",
            "question": "Does the tail reward beat mean queue reward?",
            "comparison": "Tail vs. mean queue objective",
            "change": abl_entry(factory_comp["safe_075_minus_mean_queue_objective"], "tail_queue"),
            "unit": "tail min saved",
            "conclusion": "No confirmed advantage.",
        },
        {
            "domain": "SimFactory",
            "question": "Does the gain survive burst arrivals?",
            "comparison": "Safe vs. Regression under bursts",
            "change": abl_entry(factory_comp["burst_safe_075_minus_ML"], "tail_queue"),
            "unit": "tail min saved (3.17%)",
            "conclusion": "The gain remains below the 5% target.",
        },
        {
            "domain": "SimBank",
            "question": "Do process penalties reduce refusals?",
            "comparison": "Both penalties vs. profit only",
            "change": abl_entry(bank_comp["both_minus_profit"], "refusals", scale=100.0),
            "secondaryChange": abl_entry(bank_comp["both_minus_profit"], "profit", direction=1.0),
            "unit": "refusals avoided/100",
            "conclusion": "Avoids 2.79 refusals per 100 cases with -5.70 profit change.",
        },
        {
            "domain": "SimBank",
            "question": "Do forecast features help CQL?",
            "comparison": "Full vs. history only CQL",
            "change": abl_entry(bank_comp["full_CQL_minus_history"], "profit", direction=1.0),
            "secondaryChange": abl_entry(bank_comp["full_CQL_minus_history"], "refusals", scale=100.0),
            "unit": "profit change",
            "conclusion": "Adds 71.30 profit units and avoids 3.20 refusals per 100 cases.",
        },
        {
            "domain": "SimBank",
            "question": "Does ensembling improve fitted Q?",
            "comparison": "Ensemble vs. single model",
            "change": abl_entry(bank_comp["ensemble_minus_single"], "profit", direction=1.0),
            "unit": "profit change",
            "conclusion": "The gain is not confirmed.",
        },
        {
            "domain": "SimBank",
            "question": "Does biased logging change the policy?",
            "comparison": "Biased vs. random logs",
            "change": abl_entry(bank_comp["logging_CQL_biased_minus_random"], "profit", direction=1.0),
            "unit": "profit change",
            "conclusion": "Biased logs reduce profit.",
        },
    ]

    # Common benchmark screening summary from core_data
    cell = "load_1.2_effect_0.25"
    families = ("Regression", "RandomForest", "CatBoost", "XGBoost")
    rl_algos = (("TabularQ", "Q learning"), ("FittedQ", "Fitted Q"), ("CQL_0.1", "CQL alpha 0.1"), ("CQL_0.5", "CQL alpha 0.5"), ("PPO", "PPO"))

    benchmark_common = {
        "insurance": {
            "reference": {
                "label": "FIFO",
                "mean": float(core_data["insurance"][cell]["policies"]["FIFO"]["queue"]["mean"]),
                "sd": float(core_data["insurance"][cell]["policies"]["FIFO"]["queue"]["sd"]),
            },
            "ml": {
                fam: {
                    "mean": float(core_data["insurance"][cell]["policies"][f"{fam}_ML_slot"]["queue"]["mean"]),
                    "sd": float(core_data["insurance"][cell]["policies"][f"{fam}_ML_slot"]["queue"]["sd"]),
                }
                for fam in families
            },
            "rl": {
                key: {
                    "label": lbl,
                    "mean": float(core_data["insurance"][cell]["policies"][key]["queue"]["mean"]),
                    "sd": float(core_data["insurance"][cell]["policies"][key]["queue"]["sd"]),
                }
                for key, lbl in rl_algos
            },
        },
        "bpisim": {
            "reference": {
                "label": "FIFO",
                "mean": float(core_data["bpisim"][cell]["policies"]["FIFO"]["queue"]["mean"]),
                "sd": float(core_data["bpisim"][cell]["policies"]["FIFO"]["queue"]["sd"]),
            },
            "ml": {
                fam: {
                    "mean": float(core_data["bpisim"][cell]["policies"][f"{fam}_ML_slot"]["queue"]["mean"]),
                    "sd": float(core_data["bpisim"][cell]["policies"][f"{fam}_ML_slot"]["queue"]["sd"]),
                }
                for fam in families
            },
            "rl": {
                key: {
                    "label": lbl,
                    "mean": float(core_data["bpisim"][cell]["policies"][key]["queue"]["mean"]),
                    "sd": float(core_data["bpisim"][cell]["policies"][key]["queue"]["sd"]),
                }
                for key, lbl in rl_algos
            },
        },
        "manufacturing": {
            "reference": {
                "label": "FIFO",
                "mean": float(core_data["manufacturing"][cell]["policies"]["FIFO"]["tail_queue"]["mean"]),
                "sd": float(core_data["manufacturing"][cell]["policies"]["FIFO"]["tail_queue"]["sd"]),
            },
            "ml": {
                fam: {
                    "mean": float(core_data["manufacturing"][cell]["policies"][f"{fam}_ML_slot"]["tail_queue"]["mean"]),
                    "sd": float(core_data["manufacturing"][cell]["policies"][f"{fam}_ML_slot"]["tail_queue"]["sd"]),
                }
                for fam in families
            },
            "rl": {
                key: {
                    "label": lbl,
                    "mean": float(core_data["manufacturing"][cell]["policies"][key]["tail_queue"]["mean"]),
                    "sd": float(core_data["manufacturing"][cell]["policies"][key]["tail_queue"]["sd"]),
                }
                for key, lbl in rl_algos
            },
        },
        "simbank": {
            "reference": {
                "label": "Bank rule",
                "profit_mean": float(core_data["simbank"]["negotiation"]["policies"]["Bank"]["profit"]["mean"]),
                "profit_sd": float(core_data["simbank"]["negotiation"]["policies"]["Bank"]["profit"]["sd"]),
                "refusals_mean": 100.0 * float(core_data["simbank"]["negotiation"]["policies"]["Bank"]["refusals"]["mean"]),
                "refusals_sd": 100.0 * float(core_data["simbank"]["negotiation"]["policies"]["Bank"]["refusals"]["sd"]),
            },
            "ml": {
                fam: {
                    "profit_mean": float(core_data["simbank"]["negotiation"]["policies"][f"{fam}_DP_500"]["profit"]["mean"]),
                    "profit_sd": float(core_data["simbank"]["negotiation"]["policies"][f"{fam}_DP_500"]["profit"]["sd"]),
                    "refusals_mean": 100.0 * float(core_data["simbank"]["negotiation"]["policies"][f"{fam}_DP_500"]["refusals"]["mean"]),
                    "refusals_sd": 100.0 * float(core_data["simbank"]["negotiation"]["policies"][f"{fam}_DP_500"]["refusals"]["sd"]),
                }
                for fam in families
            },
            "rl": {
                key: {
                    "label": lbl,
                    "profit_mean": float(core_data["simbank"]["negotiation"]["policies"][key]["profit"]["mean"]),
                    "profit_sd": float(core_data["simbank"]["negotiation"]["policies"][key]["profit"]["sd"]),
                    "refusals_mean": 100.0 * float(core_data["simbank"]["negotiation"]["policies"][key]["refusals"]["mean"]),
                    "refusals_sd": 100.0 * float(core_data["simbank"]["negotiation"]["policies"][key]["refusals"]["sd"]),
                }
                for key, lbl in rl_algos
            },
        },
    }

    manifest = {
        "schemaVersion": "1.0.0",
        "generatedTime": datetime.now(timezone.utc).isoformat(),
        "sourceRuns": ["runs/paper_suite_full_20261104", "runs/regression_ablation_full_20261112"],
        "sourceHashes": source_hashes,
        "seeds": seeds,
        "focusedStudies": focused_studies,
        "ablations": ablations,
        "commonBenchmark": benchmark_common,
    }

    out_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Exported canonical manifest successfully to {out_path}")


if __name__ == "__main__":
    main()

