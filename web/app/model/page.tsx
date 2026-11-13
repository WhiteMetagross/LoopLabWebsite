"use client";

import React, { useEffect, useState, useTransition } from "react";
import BpmnCanvas from "@/components/bpmn/BpmnCanvas";
import ModelInspector from "@/components/workspace/ModelInspector";
import { ProcessSpec } from "@/lib/contracts/processSpec";
import { Diagnostic } from "@/lib/bpmn/validator";
import { Sparkles, RefreshCw, FileCode, Play, Code2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const STARTER_PROMPTS = [
  {
    id: "SimClaims",
    label: "Document request preparation (SimClaims)",
    prompt:
      "A claim enters this subprocess when we request missing documents. Choose standard or specialist preparation. After preparation and the customer's response, the claim may be ready for payment, be rejected or require another document request. Another request returns to preparation. Keep preparation team selection visible. Do not assume every later request was caused by an error.",
  },
  {
    id: "BPISim",
    label: "Incomplete loan review (BPISim)",
    prompt:
      "An application enters when it is marked incomplete. Choose a standard reviewer or a specialist at that marker. Some time can pass before active work is ready. The reviewer handles the incomplete file and validates it. It can become pending, be cancelled or denied, leave the observed subprocess or become incomplete again. Another incomplete result returns to the reviewer decision.",
  },
  {
    id: "SimFactory",
    label: "Repair and reinspection (SimFactory)",
    prompt:
      "A part needs repair. Choose the standard repair team or the specialist team. Repair the part and reinspect it. A passing part goes to packing. A part that needs further repair returns to the repair team decision. A failed disposition exits separately. Every further repair must follow reinspection.",
  },
  {
    id: "SimBank",
    label: "Repeated loan offers (SimBank)",
    prompt:
      "Start a loan negotiation. Choose an offer rate between 5 and 9 percent. The customer can accept or refuse. After refusal, the bank can make another offer while the three offer limit and eligibility rules permit it. Acceptance ends with a loan. Exhausted or ineligible negotiations end with cancellation.",
  },
  {
    id: "Parallel",
    label: "Parallel stock and payment verification",
    prompt:
      "After receiving an order, check stock and check payment in parallel. Continue only when both checks finish. If stock needs correction, repeat the stock correction and check within that branch. Ship only after the parallel join.",
  },
];

export default function ModelPage() {
  const [selectedPromptId, setSelectedPromptId] = useState("SimClaims");
  const [promptText, setPromptText] = useState(STARTER_PROMPTS[0].prompt);
  const [refineText, setRefineText] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  const [currentXml, setCurrentXml] = useState<string>("");
  const [currentSpec, setCurrentSpec] = useState<ProcessSpec | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [viewMode, setViewMode] = useState<"canvas" | "xml">("canvas");
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);

  // Load default SimClaims example on initial render
  useEffect(() => {
    fetch("/examples/simclaims.bpmn")
      .then((res) => res.text())
      .then((xml) => {
        setCurrentXml(xml);
        return fetch("/examples/simclaims.json");
      })
      .then((res) => res.json())
      .then((spec) => {
        setCurrentSpec(spec);
      })
      .catch((err) => console.error("Error loading starter example:", err));
  }, []);

  const handleSelectStarter = (id: string) => {
    setSelectedPromptId(id);
    const starter = STARTER_PROMPTS.find((s) => s.id === id);
    if (starter) {
      setPromptText(starter.prompt);
      // Load corresponding bundled example
      const filename = id.toLowerCase() === "parallel" ? "parallel" : id.toLowerCase();
      fetch(`/examples/${filename}.bpmn`)
        .then((res) => res.text())
        .then((xml) => {
          setCurrentXml(xml);
          return fetch(`/examples/${filename}.json`);
        })
        .then((res) => res.json())
        .then((spec) => {
          setCurrentSpec(spec);
          setDiagnostics([]);
        })
        .catch(() => {});
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setStage("Consulting Gemini 2.5 Flash for process structure...");
    try {
      const res = await fetch("/api/models/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      setStage("Compiling ProcessIR into BPMN 2.0 XML and generating layout...");
      const data = await res.json();
      if (res.ok) {
        setCurrentXml(data.xml);
        setCurrentSpec(data.spec);
        setDiagnostics(data.diagnostics || []);
        setStage(null);
      } else {
        alert(data.error || "Generation error");
        setStage(null);
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
      setStage(null);
    }
  };

  const handleRefine = async () => {
    if (!refineText.trim() || !currentSpec) return;
    setStage("Refining process model with requested modification...");
    try {
      const res = await fetch("/api/models/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: currentSpec, changeRequest: refineText }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentXml(data.xml);
        setCurrentSpec(data.spec);
        setDiagnostics(data.diagnostics || []);
        setRefineText("");
        setStage(null);
      } else {
        alert(data.error || "Refinement error");
        setStage(null);
      }
    } catch (err: any) {
      alert("Refinement failed: " + err.message);
      setStage(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Banner and View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            BPMN Process Modeler & Specification Compiler
          </h2>
          <p className="text-xs text-slate-500">
            Generate, refine, validate, and inspect semantic business process models.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "canvas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Diagram View
            </button>
            <button
              onClick={() => setViewMode("xml")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "xml" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              BPMN XML View
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[580px]">
        {/* Left Column: Prompt & Refinement */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Starter Presets Picker */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Starter Examples:
            </label>
            <select
              value={selectedPromptId}
              onChange={(e) => handleSelectStarter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium focus:outline-none focus:border-research-blue"
            >
              {STARTER_PROMPTS.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description Prompt Input */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Natural Language Description:
              </label>
              <span className="text-[11px] text-slate-400">Gemini 2.5 Flash</span>
            </div>
            <textarea
              rows={6}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe activities, decisions, and repeat paths..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 font-sans focus:outline-none focus:border-research-blue resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!!stage}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 disabled:opacity-60 text-white rounded text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{stage ? "Processing..." : "Generate BPMN with Gemini"}</span>
            </button>

            {stage && (
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 flex items-center space-x-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span>{stage}</span>
              </div>
            )}
          </div>

          {/* Plain Language Refinement */}
          <div className="bg-white border-t-2 border-t-teal-500 border-x border-b border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Plain English Refinement:
            </label>
            <p className="text-[11px] text-slate-500">
              Modify the current model without restarting (e.g. "Run check payment and check stock in parallel").
            </p>
            <input
              type="text"
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              placeholder="Request a specific structural change..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 focus:outline-none focus:border-teal-600"
            />
            <button
              onClick={handleRefine}
              disabled={!refineText.trim() || !!stage}
              className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Apply Refinement</span>
            </button>
          </div>
        </div>

        {/* Center Column: BPMN Canvas or Raw XML */}
        <div className="lg:col-span-6 flex flex-col h-[580px]">
          {viewMode === "canvas" ? (
            <BpmnCanvas
              xml={currentXml}
              onXmlChange={(xml: string) => setCurrentXml(xml)}
              highlightedElementId={highlightedId}
            />
          ) : (
            <div className="relative w-full h-full bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-auto border border-slate-700">
              <pre>{currentXml}</pre>
            </div>
          )}
        </div>

        {/* Right Column: Model Inspector ("Why this model") */}
        <div className="lg:col-span-3 flex flex-col h-[580px]">
          <ModelInspector
            spec={currentSpec}
            diagnostics={diagnostics}
            onSelectElement={(nodeId) => setHighlightedId(nodeId)}
          />
        </div>
      </div>
    </div>
  );
}

