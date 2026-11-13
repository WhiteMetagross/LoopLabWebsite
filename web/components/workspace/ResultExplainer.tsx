"use client";

import React, { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

interface ResultExplainerProps {
  evidenceBundle: any;
}

export default function ResultExplainer({ evidenceBundle }: ResultExplainerProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    if (!evidenceBundle) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/research/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: evidenceBundle }),
      });
      const data = await res.json();
      if (res.ok) {
        setExplanation(data);
      } else {
        setError(data.error || "Failed to generate explanation.");
      }
    } catch (err: any) {
      setError(err.message || "Network error requesting explanation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Grounded Result Explanation</h3>
        </div>
        <button
          onClick={handleExplain}
          disabled={loading || !evidenceBundle}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-xs transition-all"
        >
          {loading ? (
            <span>Explaining...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain results</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
          {error}
        </div>
      )}

      {explanation ? (
        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{explanation.headline}</h4>
            <p className="text-slate-700 mt-1">{explanation.summary}</p>
          </div>

          {/* Key Findings */}
          {explanation.findings && explanation.findings.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                Key Findings:
              </span>
              <div className="grid gap-2">
                {explanation.findings.map((f: any, i: number) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-medium text-slate-900">{f.metric}: </span>
                    <span className="font-semibold text-research-blue">{f.change}</span>
                    <p className="text-slate-600 mt-0.5">{f.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tradeoffs and Operating Limits */}
          {explanation.operatingLimits && explanation.operatingLimits.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                Operating Thresholds:
              </span>
              <div className="grid gap-2">
                {explanation.operatingLimits.map((lim: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-start space-x-2"
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 ${
                        lim.status === "passes" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    />
                    <div>
                      <span className="font-medium text-slate-900">{lim.name}</span>
                      <p className="text-slate-600">{lim.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncertainty */}
          {explanation.uncertainty && (
            <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded text-slate-600">
              <span className="font-medium text-slate-800">Uncertainty & Limits: </span>
              {explanation.uncertainty}
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-500 text-xs italic">
          Click "Explain results" to request a verified, fact grounded interpretation from Gemini using the current evidence bundle.
        </p>
      )}
    </div>
  );
}

