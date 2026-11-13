"use client";

import React, { useEffect, useState } from "react";
import BpmnCanvas from "@/components/bpmn/BpmnCanvas";
import { Play, Pause, RotateCcw, FastForward, Activity, Terminal, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function SimulatePage() {
  const [currentXml, setCurrentXml] = useState<string>("");
  const [activeMode, setActiveMode] = useState<"token_play" | "research_trace" | "camunda">("token_play");
  const [selectedDomain, setSelectedDomain] = useState("SimClaims");

  // Research Workload Simulation state
  const [evaluating, setEvaluating] = useState(false);
  const [simResults, setSimResults] = useState<any | null>(null);
  const [selectedCaseStep, setSelectedCaseStep] = useState(0);

  // Camunda state
  const [camundaStatus, setCamundaStatus] = useState<any | null>(null);
  const [preparationId, setPreparationId] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<any | null>(null);
  const [instanceResult, setInstanceResult] = useState<any | null>(null);
  const [camundaLoading, setCamundaLoading] = useState(false);

  useEffect(() => {
    fetch("/examples/simclaims.bpmn")
      .then((res) => res.text())
      .then((xml) => setCurrentXml(xml))
      .catch(() => {});

    fetch("/api/camunda/status")
      .then((res) => res.json())
      .then((data) => setCamundaStatus(data))
      .catch(() => {});
  }, []);

  const handleDomainChange = (dom: string) => {
    setSelectedDomain(dom);
    const filename = dom.toLowerCase();
    fetch(`/examples/${filename}.bpmn`)
      .then((res) => res.text())
      .then((xml) => setCurrentXml(xml))
      .catch(() => {});
  };

  const handleRunWorkloadSimulation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/research/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, numCases: 15, seed: 42 }),
      });
      const data = await res.json();
      setSimResults(data);
      setSelectedCaseStep(0);
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handlePrepareCamunda = async () => {
    setCamundaLoading(true);
    try {
      const res = await fetch("/api/camunda/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml: currentXml, processId: "Process_LoopLab" }),
      });
      const data = await res.json();
      setPreparationId(data.preparationId);
    } catch (err: any) {
      alert("Preparation failed: " + err.message);
    } finally {
      setCamundaLoading(false);
    }
  };

  const handleDeployCamunda = async () => {
    if (!preparationId) return;
    setCamundaLoading(true);
    try {
      const res = await fetch("/api/camunda/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const data = await res.json();
      setDeploymentResult(data);
    } catch (err: any) {
      alert("Deployment failed: " + err.message);
    } finally {
      setCamundaLoading(false);
    }
  };

  const handleStartInstanceCamunda = async () => {
    setCamundaLoading(true);
    try {
      const res = await fetch("/api/camunda/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processDefinitionKey: deploymentResult?.processDefinitionKey,
          variables: { claimId: 101, route: "standard" },
        }),
      });
      const data = await res.json();
      setInstanceResult(data);
    } catch (err: any) {
      alert("Instance start failed: " + err.message);
    } finally {
      setCamundaLoading(false);
    }
  };

  const handleLaunchModeler = async () => {
    try {
      const res = await fetch("/api/camunda/open-modeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml: currentXml }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Camunda Modeler desktop launched with current model!");
      } else {
        alert(data.error || "Could not launch Modeler.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Banner and Simulation Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Process Simulation & Execution Playground
          </h2>
          <p className="text-xs text-slate-500">
            Compare browser token semantics, calibrated queue simulation, and Camunda 8 engine execution.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
          <button
            onClick={() => setActiveMode("token_play")}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeMode === "token_play"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Browser Token Playback
          </button>
          <button
            onClick={() => setActiveMode("research_trace")}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeMode === "research_trace"
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Research Workload Trace
          </button>
          <button
            onClick={() => setActiveMode("camunda")}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeMode === "camunda"
                ? "bg-purple-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Camunda 8 Engine
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[580px]">
        {/* Left Diagram Canvas */}
        <div className="lg:col-span-8 flex flex-col h-[580px]">
          <BpmnCanvas xml={currentXml} onXmlChange={(xml: string) => setCurrentXml(xml)} />
        </div>

        {/* Right Mode Inspector & Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-4 h-[580px] overflow-y-auto">
          {/* Mode 1: Browser Token Simulation */}
          {activeMode === "token_play" && (
            <div className="bg-white border-t-4 border-t-indigo-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Activity className="w-4 h-4" />
                <h3 className="font-bold text-slate-900 text-sm">Browser Token Simulator</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click <strong>"Token Simulation"</strong> in the canvas toolbar above to toggle animation mode. Click the Start Event or activity elements on the diagram to fire tokens and observe exclusive gateway branch selections, parallel splits, and repeat paths.
              </p>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs space-y-1.5">
                <span className="font-semibold text-indigo-900">Camunda Web Modeler Alignment:</span>
                <p className="text-slate-600">
                  Like Camunda Web Modeler's token simulation, this browser playground tests control flow topology and branch reachability. It operates on client side tokens without creating persistent engine jobs.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLaunchModeler}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Camunda Desktop Modeler</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Research Workload Simulation */}
          {activeMode === "research_trace" && (
            <div className="bg-white border-t-4 border-t-emerald-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Terminal className="w-4 h-4" />
                <h3 className="font-bold text-slate-900 text-sm">Calibrated Workload Queue Replay</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Runs the domain loop discrete event simulator using real calibrated data distributions to evaluate queue delays and repeat attempts.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Select Domain:
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
                >
                  <option value="SimClaims">SimClaims (Insurance)</option>
                  <option value="BPISim">BPISim (Loan Review)</option>
                  <option value="SimFactory">SimFactory (Manufacturing)</option>
                </select>
              </div>

              <button
                onClick={handleRunWorkloadSimulation}
                disabled={evaluating}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-all"
              >
                <span>{evaluating ? "Simulating Workload..." : "Run Workload Simulation (15 cases)"}</span>
              </button>

              {simResults && (
                <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 border rounded">
                      <span className="text-slate-500 text-[10px]">Baseline Mean Queue:</span>
                      <p className="font-bold text-slate-900 text-sm">{simResults.control.meanQueue} min</p>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <span className="text-emerald-800 text-[10px]">Candidate Policy:</span>
                      <p className="font-bold text-emerald-700 text-sm">{simResults.candidate.meanQueue} min</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700 text-xs">
                      Case 0 Chronological Event Trace:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
                      {simResults.caseZeroTrace?.map((step: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>Attempt #{step.attempt} ({step.action})</span>
                            <span className="text-research-blue">{step.outcome}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Ready: {step.readyTime}m • Service: {step.serviceStartTime}m–{step.serviceEndTime}m • Queue: {step.queueTime}m
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Camunda 8 Engine Execution */}
          {activeMode === "camunda" && (
            <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-purple-700">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="font-bold text-slate-900 text-sm">Camunda 8 Engine Gateway</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transform descriptive BPMN models into executable Camunda 8 revisions (<code>isExecutable="true"</code>) with operator authorization, durable preparation records, and engine state queries.
              </p>

              <div className="p-2.5 bg-purple-50/50 border border-purple-200 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Local Modeler Desktop:</span>
                  <span className="font-medium text-emerald-700">Installed (v5.40.0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target REST API:</span>
                  <span className="font-mono text-[11px] text-slate-700">http://localhost:8080/v2</span>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handlePrepareCamunda}
                  disabled={camundaLoading}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                >
                  <span>1. Validate & Prepare Executable Revision</span>
                  {preparationId && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={handleDeployCamunda}
                  disabled={!preparationId || camundaLoading}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                >
                  <span>2. Deploy to Camunda Cluster</span>
                  {deploymentResult && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={handleStartInstanceCamunda}
                  disabled={!deploymentResult || camundaLoading}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs"
                >
                  <span>3. Start Process Instance</span>
                  {instanceResult && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              {instanceResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1">
                  <span className="font-bold text-emerald-800">Process Instance Active:</span>
                  <p className="font-mono text-[11px] text-slate-700">Key: {instanceResult.processInstanceKey}</p>
                  <p className="text-slate-600">Active Task: {instanceResult.activeTasks?.[0]?.name}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleLaunchModeler}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded text-xs font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch in Installed Camunda Modeler</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

