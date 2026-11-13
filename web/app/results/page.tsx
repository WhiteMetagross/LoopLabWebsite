"use client";

import React, { useEffect, useState } from "react";
import { BarChart2, Filter, Download, Info, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ResultsPage() {
  const [manifest, setManifest] = useState<any | null>(null);
  const [resultsOrigin, setResultsOrigin] = useState<"paper" | "session">("paper");
  const [filterDomain, setFilterDomain] = useState<string>("all");

  useEffect(() => {
    fetch("/api/research/results")
      .then((res) => res.json())
      .then((data) => setManifest(data))
      .catch(() => {});
  }, []);

  const focused = manifest?.focusedStudies || {};
  const ablations = manifest?.ablations || [];

  const filteredAblations =
    filterDomain === "all"
      ? ablations
      : ablations.filter((a: any) => a.domain.toLowerCase() === filterDomain.toLowerCase());

  const handleDownloadManifest = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paper_results.v1.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Audited Research Results & Ablation Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Immutable numbers from audited runs across held out workloads and three training seeds.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Origin Switch */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setResultsOrigin("paper")}
              className={`px-3 py-1.5 rounded transition-colors ${
                resultsOrigin === "paper"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paper Results (Audited)
            </button>
            <button
              onClick={() => setResultsOrigin("session")}
              className={`px-3 py-1.5 rounded transition-colors ${
                resultsOrigin === "session"
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Session
            </button>
          </div>

          <button
            onClick={handleDownloadManifest}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-700 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {resultsOrigin === "paper" ? (
        <div className="space-y-8">
          {/* Table III: Focused Held-Out Comparisons */}
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Table III: Focused Held Out Comparisons using Regression Forecasts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lower primary outcomes are better. Means and paired 95% intervals use three seeds.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">runs/regression_ablation_full_20261112</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Simulator</th>
                    <th className="py-2.5 px-3">Control</th>
                    <th className="py-2.5 px-3">Controller</th>
                    <th className="py-2.5 px-3">Outcome ↓</th>
                    <th className="py-2.5 px-3">Gain ↑ [95% CI]</th>
                    <th className="py-2.5 px-3">Other Outcome [95% CI]</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(focused).map(([simName, data]: [string, any]) => {
                    const domainBadge =
                      simName === "SimClaims"
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : simName === "BPISim"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : simName === "SimFactory"
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-purple-50 text-purple-800 border-purple-200";

                    return (
                      <tr key={simName} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${domainBadge}`}>
                            {simName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{data.control.label}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{data.candidate.label}</td>
                        <td className="py-3 px-3 font-mono">
                          {data.primaryMetric.controlMean.toFixed(2)} → {data.primaryMetric.candidateMean.toFixed(2)}{" "}
                          {data.primaryMetric.unit.split(" ")[0]}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-indigo-700">
                            {data.primaryMetric.signedGain.toFixed(2)} [{data.primaryMetric.pairedCi95[0].toFixed(2)},{" "}
                            {data.primaryMetric.pairedCi95[1].toFixed(2)}]
                          </span>
                          <span className="text-slate-500 ml-1">({data.primaryMetric.percentageGain.toFixed(2)}%)</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {data.secondaryMetric?.change.toFixed(3)} [{data.secondaryMetric?.pairedCi95[0].toFixed(3)},{" "}
                          {data.secondaryMetric?.pairedCi95[1].toFixed(3)}] {data.secondaryMetric?.unit}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border shadow-xs ${
                              data.selectionStatus === "selected"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : data.selectionStatus === "forced_sensitivity"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-purple-50 text-purple-800 border-purple-300"
                            }`}
                          >
                            {data.selectionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Table IV: Component & Timing Ablations */}
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Table IV: Component, Timing, Reward and Logging Ablations on Held Out Streams
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Positive saved or avoided values favor the first policy. Intervals are paired across three seeds.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-medium"
                >
                  <option value="all">All Domains</option>
                  <option value="SimClaims">SimClaims</option>
                  <option value="BPISim">BPISim</option>
                  <option value="SimFactory">SimFactory</option>
                  <option value="SimBank">SimBank</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Research Question</th>
                    <th className="py-2.5 px-3">Comparison</th>
                    <th className="py-2.5 px-3">Held Out Change [95% CI]</th>
                    <th className="py-2.5 px-3">Audited Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAblations.map((abl: any, idx: number) => {
                    const domainBadge =
                      abl.domain === "SimClaims"
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : abl.domain === "BPISim"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : abl.domain === "SimFactory"
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-purple-50 text-purple-800 border-purple-200";

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${domainBadge}`}>
                            {abl.domain}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{abl.question}</td>
                        <td className="py-3 px-3 text-slate-600">{abl.comparison}</td>
                        <td className="py-3 px-3 font-mono">
                          {abl.change.value.toFixed(2)} [{abl.change.ci95[0].toFixed(2)},{" "}
                          {abl.change.ci95[1].toFixed(2)}] {abl.unit}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{abl.conclusion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* Session Results View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center space-y-3">
          <Info className="w-8 h-8 text-research-blue mx-auto" />
          <h3 className="font-semibold text-slate-900 text-sm">Session Results Stream</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Live interactive simulations executed in this browser session are tracked here. Run an evaluation from the Simulate or Optimize tab to record fresh workload samples.
          </p>
        </div>
      )}
    </div>
  );
}

