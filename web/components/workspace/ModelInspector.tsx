"use client";

import React, { useState } from "react";
import { ProcessSpec, ModelingDecision } from "@/lib/contracts/processSpec";
import { Diagnostic } from "@/lib/bpmn/validator";
import { HelpCircle, CheckCircle2, AlertTriangle, AlertCircle, Info, Layers, Bookmark } from "lucide-react";

interface ModelInspectorProps {
  spec?: ProcessSpec | null;
  diagnostics?: Diagnostic[];
  onSelectElement?: (elementId: string) => void;
}

export default function ModelInspector({
  spec,
  diagnostics = [],
  onSelectElement,
}: ModelInspectorProps) {
  const [activeTab, setActiveTab] = useState<"rationale" | "assumptions" | "validation">("rationale");

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
        <button
          onClick={() => setActiveTab("rationale")}
          className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2.5 border-b-2 transition-colors ${
            activeTab === "rationale"
              ? "border-research-blue text-research-blue bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Rationale</span>
          {spec?.modelingDecisions?.length ? (
            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] shrink-0">
              {spec.modelingDecisions.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("assumptions")}
          className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2.5 border-b-2 transition-colors ${
            activeTab === "assumptions"
              ? "border-research-blue text-research-blue bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Assumptions</span>
        </button>

        <button
          onClick={() => setActiveTab("validation")}
          className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2.5 border-b-2 transition-colors ${
            activeTab === "validation"
              ? "border-research-blue text-research-blue bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Validation</span>
          {errors.length > 0 ? (
            <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full text-[10px] shrink-0">
              {errors.length}
            </span>
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1 shrink-0" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "rationale" && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 text-xs uppercase tracking-wider">
              Modeling Decisions:
            </h4>
            {spec?.modelingDecisions && spec.modelingDecisions.length > 0 ? (
              spec.modelingDecisions.map((dec, idx) => {
                const borderColors = [
                  "border-l-purple-500",
                  "border-l-teal-500",
                  "border-l-amber-500",
                  "border-l-rose-500",
                  "border-l-sky-500",
                ];
                const bCol = borderColors[idx % borderColors.length];
                return (
                  <div
                    key={dec.id}
                    className={`p-3 bg-white border border-slate-200 border-l-4 ${bCol} rounded-md text-xs space-y-1.5 shadow-xs hover:border-slate-300 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900">{dec.choice}</span>
                      <span className="font-mono text-[10px] text-slate-400">{dec.id}</span>
                    </div>
                    <p className="text-slate-600">{dec.justification}</p>
                    {dec.references && dec.references.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <span className="font-medium">Cited input: </span>
                        <span className="italic">"{dec.references.join('", "')}"</span>
                      </div>
                    )}
                    {dec.affectedBlockIds && dec.affectedBlockIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {dec.affectedBlockIds.map((bId) => (
                          <button
                            key={bId}
                            onClick={() => onSelectElement && onSelectElement(`Task_${bId}`)}
                            className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] hover:bg-purple-100 font-medium"
                          >
                            Node: {bId}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs italic">
                No modeling decisions recorded yet. Generate or select an example model to view rationale.
              </p>
            )}

            {spec?.researchBindingCandidate && (
              <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-200 rounded-md text-xs">
                <span className="font-semibold text-purple-900">
                  Proposed Research Domain Binding: {spec.researchBindingCandidate.domain}
                </span>
                <p className="text-slate-600 mt-1">
                  Mapped decision elements allow bounded simulation and evaluation against saved research artifacts.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "assumptions" && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 text-xs uppercase tracking-wider">
              Process Assumptions:
            </h4>
            {spec?.assumptions && spec.assumptions.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-700">
                {spec.assumptions.map((asm, i) => (
                  <li key={i} className="flex items-start space-x-2 p-2 bg-amber-50/50 border-l-2 border-l-amber-500 rounded">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{asm}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-xs italic">No explicit assumptions recorded.</p>
            )}
          </div>
        )}

        {activeTab === "validation" && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 text-xs uppercase tracking-wider">
              Profile & Gate Status:
            </h4>
            {diagnostics.length === 0 ? (
              <div className="p-3 bg-emerald-50 border-l-4 border-l-emerald-500 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>All profile gates and structural checks passed successfully.</span>
              </div>
            ) : (
              diagnostics.map((diag, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border text-xs space-y-1 ${
                    diag.severity === "error"
                      ? "bg-rose-50 border-rose-200 border-l-4 border-l-rose-500 text-rose-800"
                      : diag.severity === "warning"
                      ? "bg-amber-50 border-amber-200 border-l-4 border-l-amber-500 text-amber-800"
                      : "bg-sky-50 border-sky-200 border-l-4 border-l-sky-500 text-sky-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase text-[10px] tracking-wide">
                      {diag.severity}: {diag.ruleId}
                    </span>
                    {diag.elementId && (
                      <span className="font-mono text-[10px]">{diag.elementId}</span>
                    )}
                  </div>
                  <p>{diag.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

