"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Layers, Sliders, ShieldCheck, HelpCircle, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";

export default function OverviewPage() {
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/research/catalog")
      .then((res) => res.json())
      .then((data) => setCatalog(data.domains || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Title & Research Framing */}
      <section className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Rainbow Spectrum Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 via-teal-500 via-sky-500 via-indigo-600 to-purple-600" />
        <div className="max-w-3xl space-y-4 pt-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-800">
            <span>Research Workbench</span>
            <span>•</span>
            <span>Published Study & Live Demonstration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Learning Based Interventions for Rework and Repeated Decisions in Business Processes
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Repeated activities in business processes arise from customer documentation cycles, quality rework loops, or iterative negotiations. LoopLab demonstrates how Gemini generated BPMN processes, browser token playgrounds, and validation selected machine learning controllers optimize resource queues and repeated decisions while respecting domain operating limits.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/model"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Open Process Modeler</span>
            </Link>
            <Link
              href="/simulate"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Explore Token Simulation</span>
            </Link>
            <Link
              href="/results"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-xs font-semibold transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span>View Audited Results</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Step Quick Start */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Interactive Research Workflow:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              1
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Describe in Plain English</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe activities, decisions, and repeat paths. Gemini generates a structured process specification, concise modeling decisions, and deterministic BPMN 2.0 XML.
            </p>
          </div>

          <div className="bg-white border-t-4 border-t-teal-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Simulate with Tokens</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Execute token animation directly inside the browser using bpmn-js-token-simulation to observe gateway splits, concurrency, and repeat loopbacks.
            </p>
          </div>

          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Evaluate Intervention Policy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate real machine learning routing and RL controllers against baseline FIFO control. Inspect queue savings, confidence intervals, and operating thresholds.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Research Domain Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Four Verified Research Presets:
          </h2>
          <span className="text-xs text-slate-500">Evaluated on held out workloads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {catalog.map((dom) => {
            const domainTheme =
              dom.id === "SimClaims"
                ? {
                    border: "border-t-4 border-t-sky-500",
                    badge: "bg-sky-50 text-sky-800 border-sky-300",
                    gain: "text-sky-600",
                    link: "text-sky-600 hover:text-sky-800",
                  }
                : dom.id === "BPISim"
                ? {
                    border: "border-t-4 border-t-emerald-500",
                    badge: "bg-emerald-50 text-emerald-800 border-emerald-300",
                    gain: "text-emerald-600",
                    link: "text-emerald-600 hover:text-emerald-800",
                  }
                : dom.id === "SimFactory"
                ? {
                    border: "border-t-4 border-t-amber-500",
                    badge: "bg-amber-50 text-amber-900 border-amber-300",
                    gain: "text-amber-700",
                    link: "text-amber-700 hover:text-amber-900",
                  }
                : {
                    border: "border-t-4 border-t-purple-500",
                    badge: "bg-purple-50 text-purple-800 border-purple-300",
                    gain: "text-purple-600",
                    link: "text-purple-600 hover:text-purple-800",
                  };

            return (
              <div
                key={dom.id}
                className={`bg-white border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors ${domainTheme.border}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{dom.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{dom.problem}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-semibold text-[10px] rounded border ${domainTheme.badge}`}
                  >
                    {dom.id}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Intervention:</span>
                    <span className="font-medium text-slate-900">{dom.interventionPoint}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Primary Metric:</span>
                    <span className="font-medium text-slate-900">{dom.primaryMetric}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Audited Paper Gain:</span>
                    <span className={`font-semibold ${domainTheme.gain}`}>{dom.savedPaperGain}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-1">
                    <span className="text-slate-500 shrink-0">Operating Limit:</span>
                    <span
                      className="font-medium text-slate-800 text-right max-w-[320px] ml-2 leading-tight"
                      title={dom.operatingLimit}
                    >
                      {dom.operatingLimit}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href={`/model?preset=${dom.id}`}
                    className={`inline-flex items-center space-x-1 text-xs font-semibold ${domainTheme.link}`}
                  >
                    <span>Open in Modeler</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/optimize?domain=${dom.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <span>Inspect Policy</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

