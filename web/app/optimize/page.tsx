"use client";

import React, { useEffect, useState } from "react";
import BpmnCanvas from "@/components/bpmn/BpmnCanvas";
import ComparisonCharts from "@/components/charts/ComparisonCharts";
import ResultExplainer from "@/components/workspace/ResultExplainer";
import { Sliders, Play, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Layers } from "lucide-react";

export default function OptimizePage() {
  const [selectedDomain, setSelectedDomain] = useState("SimClaims");
  const [paperResults, setPaperResults] = useState<any | null>(null);
  const [currentXml, setCurrentXml] = useState<string>("");
  const [evaluating, setEvaluating] = useState(false);
  const [liveResult, setLiveResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/research/results")
      .then((res) => res.json())
      .then((data) => setPaperResults(data))
      .catch(() => {});

    loadDomainModel("SimClaims");
  }, []);

  const loadDomainModel = (domain: string) => {
    setSelectedDomain(domain);
    const filename = domain.toLowerCase();
    fetch(`/examples/${filename}.bpmn`)
      .then((res) => res.text())
      .then((xml) => setCurrentXml(xml))
      .catch(() => {});
  };

  const currentStudy = paperResults?.focusedStudies?.[selectedDomain];

  const handleRunComparison = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/research/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, numCases: 20, seed: 42 }),
      });
      const data = await res.json();
      setLiveResult(data);
    } catch (err: any) {
      alert("Evaluation failed: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Intervention Policy Optimization & Evaluation
          </h2>
          <p className="text-xs text-slate-500">
            Compare deterministic baselines against validation selected forecasters and reinforcement learning controllers.
          </p>
        </div>

        {/* Domain Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Preset:</label>
          <select
            value={selectedDomain}
            onChange={(e) => loadDomainModel(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-3 py-1.5 font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-research-blue"
          >
            <option value="SimClaims">SimClaims (Insurance)</option>
            <option value="BPISim">BPISim (Loan Review)</option>
            <option value="SimFactory">SimFactory (Manufacturing)</option>
            <option value="SimBank">SimBank (Negotiation)</option>
          </select>

          <button
            onClick={handleRunComparison}
            disabled={evaluating}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{evaluating ? "Evaluating..." : "Run Live Comparison"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Diagram with Policy Overlay */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Intervention Policy Overlay on BPMN:
            </span>
            <span className="text-[11px] text-slate-500">
              Highlighting routing decisions & repeat loops
            </span>
          </div>
          <div className="h-[520px]">
            <BpmnCanvas xml={currentXml} />
          </div>
        </div>

        {/* Right Charts and Explanations */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {currentStudy && (
            <ComparisonCharts
              title={currentStudy.primaryMetric.label}
              unit={currentStudy.primaryMetric.unit}
              betterDirection={currentStudy.primaryMetric.betterDirection}
              controlName={currentStudy.control.label}
              controlValue={
                liveResult ? liveResult.control.meanQueue : currentStudy.primaryMetric.controlMean
              }
              candidateName={currentStudy.candidate.label}
              candidateValue={
                liveResult ? liveResult.candidate.meanQueue : currentStudy.primaryMetric.candidateMean
              }
              signedGain={
                liveResult ? liveResult.signedGainMinutes : currentStudy.primaryMetric.signedGain
              }
              percentageGain={
                liveResult ? liveResult.percentageGain : currentStudy.primaryMetric.percentageGain
              }
              ci95={currentStudy.primaryMetric.pairedCi95}
              limit={currentStudy.secondaryMetric?.limit}
              limitStatus={currentStudy.secondaryMetric?.limitStatus}
            />
          )}

          {/* Secondary Outcome & Limits */}
          {currentStudy?.secondaryMetric && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Secondary Outcome: {currentStudy.secondaryMetric.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    currentStudy.secondaryMetric.limitStatus === "passes"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {currentStudy.secondaryMetric.limitStatus}
                </span>
              </div>
              <p className="text-slate-600">{currentStudy.secondaryMetric.limitDescription}</p>
              {currentStudy.secondaryMetric.pairedCi95 && (
                <div className="text-[11px] text-slate-500">
                  Paired 95% CI: [{currentStudy.secondaryMetric.pairedCi95[0].toFixed(3)},{" "}
                  {currentStudy.secondaryMetric.pairedCi95[1].toFixed(3)}]
                </div>
              )}
            </div>
          )}

          {/* Grounded Result Explainer */}
          {currentStudy && <ResultExplainer evidenceBundle={currentStudy} />}
        </div>
      </div>
    </div>
  );
}

