"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ErrorBar,
  CartesianGrid,
} from "recharts";

interface ComparisonChartsProps {
  title: string;
  unit: string;
  betterDirection: "lower" | "higher";
  controlName: string;
  controlValue: number;
  candidateName: string;
  candidateValue: number;
  signedGain: number;
  percentageGain: number;
  ci95?: [number, number];
  limit?: number;
  limitStatus?: "passes" | "fails" | "inconclusive" | "unresolved";
}

export default function ComparisonCharts({
  title,
  unit,
  betterDirection,
  controlName,
  controlValue,
  candidateName,
  candidateValue,
  signedGain,
  percentageGain,
  ci95,
  limit,
  limitStatus,
}: ComparisonChartsProps) {
  const chartData = [
    {
      name: controlName,
      value: Number(controlValue.toFixed(2)),
      fill: "#4f46e5", // Vibrant Indigo (Control)
    },
    {
      name: candidateName,
      value: Number(candidateValue.toFixed(2)),
      fill: "#e11d48", // Vibrant Rose (Candidate)
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit: {unit} ({betterDirection === "lower" ? "lower is better" : "higher is better"})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-200 rounded shadow-xs">
            Gain: {signedGain > 0 ? `+${signedGain.toFixed(2)}` : signedGain.toFixed(2)} {unit} ({percentageGain.toFixed(2)}%)
          </span>
          {limitStatus && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border shadow-xs ${
                limitStatus === "passes"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : limitStatus === "unresolved"
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-rose-50 text-rose-700 border-rose-300"
              }`}
            >
              Limit: {limitStatus}
            </span>
          )}
        </div>
      </div>

      {/* Bar Chart View */}
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} unit={` ${unit.split(" ")[0]}`} />
            <Tooltip
              formatter={(val: any) => [`${val} ${unit}`, "Outcome"]}
              contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "6px" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Uncertainty and 95% Confidence Interval Footer */}
      {ci95 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            <span className="font-medium text-slate-700">Paired 95% Confidence Interval: </span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              [{ci95[0].toFixed(2)}, {ci95[1].toFixed(2)}]
            </span>
          </div>
          <p className="text-slate-500">Evaluated across 3 seeds on held out workloads.</p>
        </div>
      )}
    </div>
  );
}

