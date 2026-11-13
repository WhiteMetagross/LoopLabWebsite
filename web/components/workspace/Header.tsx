"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Compass, Layers, PlayCircle, Sliders, BarChart2, BookOpen } from "lucide-react";
import LoopLabLogo from "./LoopLabLogo";

export default function Header() {
  const pathname = usePathname();
  const [camundaStatus, setCamundaStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/camunda/status")
      .then((res) => res.json())
      .then((data) => setCamundaStatus(data))
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Overview", href: "/", icon: Compass, activeClass: "border-sky-600 text-sky-700 bg-sky-50/60", iconColor: "text-sky-600" },
    { label: "Model", href: "/model", icon: Layers, activeClass: "border-purple-600 text-purple-700 bg-purple-50/60", iconColor: "text-purple-600" },
    { label: "Simulate", href: "/simulate", icon: PlayCircle, activeClass: "border-emerald-600 text-emerald-700 bg-emerald-50/60", iconColor: "text-emerald-600" },
    { label: "Optimize", href: "/optimize", icon: Sliders, activeClass: "border-amber-600 text-amber-700 bg-amber-50/60", iconColor: "text-amber-600" },
    { label: "Results", href: "/results", icon: BarChart2, activeClass: "border-rose-600 text-rose-700 bg-rose-50/60", iconColor: "text-rose-600" },
    { label: "Research", href: "/research", icon: BookOpen, activeClass: "border-indigo-600 text-indigo-700 bg-indigo-50/60", iconColor: "text-indigo-600" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Rainbow Spectrum Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 via-teal-500 via-sky-500 via-indigo-600 to-purple-600" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Research Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <LoopLabLogo className="w-8 h-8" />
              <div>
                <span className="font-bold text-slate-900 text-base tracking-tight">LoopLab</span>
                <span className="hidden md:inline-block text-xs text-slate-500 ml-2 font-normal">
                  Learning Based Interventions for Repeated Decisions in Business Processes
                </span>
              </div>
            </Link>
          </div>

          {/* System Environment Indicators */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50/80 border border-amber-200 rounded-full text-amber-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium">Gemini: 2.5 Flash</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50/80 border border-emerald-200 rounded-full text-emerald-800 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">
                Camunda Modeler: {camundaStatus?.modelerInstalled ? "Installed" : "Detected"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs with Rainbow Signature Accents */}
        <nav className="flex space-x-1 -mb-px overflow-x-auto text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `${item.activeClass} font-semibold`
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "" : item.iconColor}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

