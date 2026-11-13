"""Verify canonical website result manifest against paper values and source hashes."""

from hashlib import sha256
import json
from pathlib import Path
import sys

import numpy as np


def main():
    repo_root = Path(__file__).resolve().parents[2]
    manifest_path = repo_root / "LoopLabProject" / "web" / "public" / "research" / "paper_results.v1.json"
    if not manifest_path.exists():
        print(f"Error: manifest file {manifest_path} not found.")
        sys.exit(1)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # 1. Verify source hashes
    for source_key, source_rel in [
        ("paper_suite_full_20261104", "runs/paper_suite_full_20261104/aggregate.json"),
        ("regression_ablation_full_20261112", "runs/regression_ablation_full_20261112/results.json"),
        ("regression_paper_artifacts", "report/paper_figures/regression_paper_artifacts.json"),
    ]:
        p = repo_root / source_rel
        curr_hash = sha256(p.read_bytes()).hexdigest()
        recorded_hash = manifest["sourceHashes"][source_key]
        if curr_hash != recorded_hash:
            print(f"Error: Hash mismatch for {source_key}: expected {recorded_hash}, got {curr_hash}")
            sys.exit(1)

    # 2. Check SimClaims
    claims = manifest["focusedStudies"]["SimClaims"]
    assert np.isclose(claims["primaryMetric"]["controlMean"], 55.85, atol=0.01)
    assert np.isclose(claims["primaryMetric"]["candidateMean"], 49.56, atol=0.01)
    assert np.isclose(claims["primaryMetric"]["signedGain"], 6.28, atol=0.02)
    assert np.isclose(claims["primaryMetric"]["percentageGain"], 11.25, atol=0.05)
    assert np.isclose(claims["primaryMetric"]["pairedCi95"][0], 5.04, atol=0.02)
    assert np.isclose(claims["primaryMetric"]["pairedCi95"][1], 7.53, atol=0.02)
    assert np.isclose(claims["secondaryMetric"]["change"], 0.322, atol=0.01)

    # 3. Check BPISim
    bpi = manifest["focusedStudies"]["BPISim"]
    assert np.isclose(bpi["primaryMetric"]["controlMean"], 8974.01, atol=0.05)
    assert np.isclose(bpi["primaryMetric"]["candidateMean"], 8963.69, atol=0.05)
    assert np.isclose(bpi["primaryMetric"]["signedGain"], 10.32, atol=0.05)
    assert np.isclose(bpi["primaryMetric"]["pairedCi95"][0], -3.55, atol=0.05)
    assert np.isclose(bpi["primaryMetric"]["pairedCi95"][1], 28.66, atol=0.05)
    assert bpi["selectionStatus"] == "forced_sensitivity"

    # 4. Check SimFactory
    fac = manifest["focusedStudies"]["SimFactory"]
    assert np.isclose(fac["primaryMetric"]["controlMean"], 688.88, atol=0.05)
    assert np.isclose(fac["primaryMetric"]["candidateMean"], 638.59, atol=0.05)
    assert np.isclose(fac["primaryMetric"]["signedGain"], 50.29, atol=0.05)
    assert np.isclose(fac["primaryMetric"]["pairedCi95"][0], 33.69, atol=0.05)
    assert np.isclose(fac["primaryMetric"]["pairedCi95"][1], 68.45, atol=0.05)
    assert np.isclose(fac["secondaryMetric"]["change"], 0.405, atol=0.01)

    # 5. Check SimBank
    bank = manifest["focusedStudies"]["SimBank"]
    assert np.isclose(bank["primaryMetric"]["controlMean"], 25.04, atol=0.05)
    assert np.isclose(bank["primaryMetric"]["candidateMean"], 19.29, atol=0.05)
    assert np.isclose(bank["primaryMetric"]["signedGain"], 5.75, atol=0.05)
    assert np.isclose(bank["primaryMetric"]["pairedCi95"][0], 4.82, atol=0.05)
    assert np.isclose(bank["primaryMetric"]["pairedCi95"][1], 6.85, atol=0.05)
    assert np.isclose(bank["secondaryMetric"]["change"], 6.92, atol=0.05)

    print("All checks passed: manifest accurately reproduces paper values and hashes.")


if __name__ == "__main__":
    main()

