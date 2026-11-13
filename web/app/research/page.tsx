"use client";

import React from "react";
import { BookOpen, Database, ShieldAlert, Cpu, Award } from "lucide-react";

export default function ResearchPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Title */}
      <section className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-research-blue">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Research Documentation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Learning Based Interventions for Rework and Repeated Decisions
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Technical specifications, domain modeling assumptions, simulator architectures, and data provenance governing the LoopLab study.
        </p>
      </section>

      {/* Domain Simulator Specifications */}
      <section className="space-y-6">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">
          Four Specialized Simulation Environments:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border-t-4 border-t-sky-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2.5">
            <h3 className="font-bold text-sky-900 text-sm">1. SimClaims (Document Request Cycle)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When missing documents are requested, a preparation episode opens. Later requests can repeat the episode. The intervention routes between standard and specialist preparation under shared capacity.
            </p>
            <div className="pt-1 text-xs text-slate-700 space-y-1">
              <div><strong>Primary Outcome:</strong> Mean queue wait per claim (minutes).</div>
              <div><strong className="text-sky-700">Gain:</strong> 6.28 minutes saved (11.25 percent reduction) with 95% CI [5.04, 7.53].</div>
              <div><strong>Mechanism:</strong> Congestion aware routing accounts for 11.01 minutes of queue preservation.</div>
            </div>
          </div>

          <div className="bg-white border-t-4 border-t-emerald-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2.5">
            <h3 className="font-bold text-emerald-900 text-sm">2. BPISim (Incomplete Loan Review)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              An application arrives at an Incomplete Review Marker. The forced episodic controller acts at that marker to assign review handling.
            </p>
            <div className="pt-1 text-xs text-slate-700 space-y-1">
              <div><strong>Primary Outcome:</strong> Total elapsed application turnaround (minutes).</div>
              <div><strong className="text-emerald-700">Finding:</strong> Turnaround changes from 8,974.01 to 8,963.69 min (10.32 min saving, interval [-3.55, 28.66] crosses zero).</div>
              <div><strong>Constraint:</strong> Active review work accounts for only 0.68 percent of total elapsed time.</div>
            </div>
          </div>

          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2.5">
            <h3 className="font-bold text-amber-900 text-sm">3. SimFactory (Manufacturing Repair & Reinspection)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Repair and reinspection form a physical repeat loop. A repeated repair must strictly receive reinspection. The policy routes standard versus specialist repair with accrued wait state.
            </p>
            <div className="pt-1 text-xs text-slate-700 space-y-1">
              <div><strong>Primary Outcome:</strong> Tail queue wait (8 longest waiting jobs in 80-job batch).</div>
              <div><strong className="text-amber-800">Gain:</strong> 50.29 tail minutes saved (7.30 percent reduction) with 95% CI [33.69, 68.45].</div>
              <div><strong>Tradeoff:</strong> Extra repairs rise by 0.405/100, with upper CI bound (0.551) exceeding 0.50 threshold.</div>
            </div>
          </div>

          <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200 rounded-lg p-5 shadow-sm space-y-2.5">
            <h3 className="font-bold text-purple-900 text-sm">4. SimBank (Repeated Negotiation Extension)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iterative commercial loan negotiation where interest rates (5 to 9 percent) are offered over at most three rounds. Refusal repetition is business negotiation rather than corrective rework.
            </p>
            <div className="pt-1 text-xs text-slate-700 space-y-1">
              <div><strong>Primary Outcome:</strong> Customer refusals per 100 negotiations.</div>
              <div><strong className="text-purple-700">Gain:</strong> Refusals decrease from 25.04 to 19.29 per 100 cases (22.95 percent reduction).</div>
              <div><strong>Tradeoff:</strong> Native profit changes by 6.92 units with interval [-67.93, 93.57], inconclusive gain/loss.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Provenance and Data Rights */}
      <section className="bg-white border border-slate-200 border-l-4 border-l-teal-500 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-research-blue">
          <Database className="w-4 h-4" />
          <h2 className="text-base font-bold text-slate-900">Data Provenance & Ethical Acquisition</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          All research datasets were legally acquired from institutional repositories and verified via cryptographic checksums:
        </p>

        <ul className="text-xs text-slate-700 space-y-2">
          <li>
            <strong>SimClaims:</strong> Mendeley Data, DOI: 10.17632/kdcspz6xtn.1 (CC BY 4.0).
          </li>
          <li>
            <strong>BPISim:</strong> BPI Challenge 2017 Event Log, 4TU.ResearchData, DOI: 10.4121/uuid:5f3067df-f10b-45da-b98b-86ae4c7a310b.
          </li>
          <li>
            <strong>SimFactory:</strong> Batch Production Log, 4TU.ResearchData, DOI: 10.4121/uuid:68726926-5ac5-4fab-b873-ee76ea412399.
          </li>
        </ul>
      </section>

      {/* Seeding and Evaluation Protocol */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">Rigor and Evaluation Protocol:</h2>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>Master seed 17 deterministically generated 3 training seeds: 1154929522, 2035845825, 1193624495.</li>
          <li>384 held out workloads evaluated per seed for routing domains; 30,000 paired cases per seed for SimBank.</li>
          <li>Common random streams preserved across matched baseline and candidate policy draws.</li>
          <li>No em dashes, no pictorial status markers, and no ungrounded claims throughout reports and interfaces.</li>
        </ul>
      </section>
    </div>
  );
}

