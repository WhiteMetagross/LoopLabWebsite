"use client";

import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import BpmnModeler from "bpmn-js/lib/Modeler";
// @ts-ignore
import tokenSimulation from "bpmn-js-token-simulation";
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, Download, ExternalLink, Activity } from "lucide-react";

interface BpmnCanvasInnerProps {
  xml: string;
  onXmlChange?: (newXml: string) => void;
  highlightedElementId?: string;
  policyOverlay?: {
    standardFlowId?: string;
    specialistFlowId?: string;
    chosenAction?: "standard" | "specialist";
  };
}

// Deep unwrap for Next.js / Webpack ESM interop in didi injection
function unwrapModule(mod: any): any {
  if (!mod) return mod;
  if (mod.default && (mod.default.__init__ || mod.default.__depends__)) {
    mod = mod.default;
  }
  const result: any = {};
  for (const key of Object.keys(mod)) {
    const val = mod[key];
    if (Array.isArray(val) && val[0] === "type" && typeof val[1] === "object" && val[1]?.default) {
      result[key] = ["type", val[1].default];
    } else if (Array.isArray(val) && val[0] === "factory" && typeof val[1] === "object" && val[1]?.default) {
      result[key] = ["factory", val[1].default];
    } else if (key === "__depends__" && Array.isArray(val)) {
      result[key] = val.map(unwrapModule);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export default function BpmnCanvasInner({
  xml,
  onXmlChange,
  highlightedElementId,
  policyOverlay,
}: BpmnCanvasInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let additionalModules: any[] = [];
    try {
      const unwrapped = unwrapModule(tokenSimulation);
      if (unwrapped) {
        additionalModules.push(unwrapped);
      }
    } catch (e) {
      console.warn("Could not load token simulation module:", e);
    }

    let modeler: any;
    try {
      modeler = new BpmnModeler({
        container: containerRef.current,
        additionalModules,
      });
    } catch (e) {
      // Fallback without simulation module if injection fails
      modeler = new BpmnModeler({
        container: containerRef.current,
      });
    }

    modelerRef.current = modeler;

    return () => {
      if (modeler) {
        modeler.destroy();
      }
      modelerRef.current = null;
    };
  }, []);

  // Import XML whenever xml changes
  useEffect(() => {
    const modeler = modelerRef.current;
    if (!modeler || !xml) return;

    modeler
      .importXML(xml)
      .then(() => {
        setLoadError(null);
        setTimeout(() => {
          try {
            const canvas = modeler.get("canvas");
            canvas.zoom("fit-viewport", "auto");
          } catch {}
        }, 60);
      })
      .catch((err: any) => {
        console.error("Failed to render BPMN diagram:", err);
        setLoadError(err.message || "Failed to render BPMN diagram.");
      });
  }, [xml]);

  // Handle element highlight
  useEffect(() => {
    const modeler = modelerRef.current;
    if (!modeler || !highlightedElementId) return;

    try {
      const canvas = modeler.get("canvas");
      canvas.addMarker(highlightedElementId, "highlight-node");
      return () => {
        try {
          canvas.removeMarker(highlightedElementId, "highlight-node");
        } catch {}
      };
    } catch {}
  }, [highlightedElementId]);

  const handleToggleSimulation = () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    try {
      const tokenSim = modeler.get("toggleMode");
      if (tokenSim) {
        tokenSim.toggleMode();
        setIsSimulating((prev) => !prev);
      }
    } catch (e) {
      console.warn("Token simulation toggle:", e);
    }
  };

  const handleZoom = (delta: number) => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    const canvas = modeler.get("canvas");
    const current = canvas.zoom();
    const next = Math.max(0.2, Math.min(3, current + delta));
    canvas.zoom(next);
    setZoomLevel(next);
  };

  const handleFit = () => {
    const modeler = modelerRef.current;
    if (!modeler) return;
    try {
      const canvas = modeler.get("canvas");
      canvas.zoom("fit-viewport", "auto");
    } catch {}
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "process_model.bpmn";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInCamundaModeler = async () => {
    try {
      const res = await fetch("/api/camunda/open-modeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Launched model in Camunda Modeler desktop application.");
      } else {
        alert(data.error || "Could not launch Camunda Modeler.");
      }
    } catch (err: any) {
      alert("Error contacting Camunda launch endpoint: " + err.message);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-semibold text-xs shadow-xs transition-colors ${
              isSimulating
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isSimulating ? "Exit Token Simulation" : "Token Simulation"}</span>
          </button>

          <button
            onClick={handleOpenInCamundaModeler}
            title="Open in installed Camunda Modeler Desktop application"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-medium border border-indigo-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open in Camunda Modeler</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoom(0.15)}
            title="Zoom In"
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            title="Zoom Out"
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to Screen"
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            title="Download BPMN XML"
            className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-medium border border-emerald-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>XML</span>
          </button>
        </div>
      </div>

      {/* BPMN Container */}
      <div className="relative flex-1 w-full h-[520px]">
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 text-red-700 p-4 text-center z-10">
            <div>
              <p className="font-semibold text-sm">Failed to render diagram</p>
              <p className="text-xs mt-1">{loadError}</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <style jsx global>{`
        .highlight-node:not(.djs-connection) .djs-visual > :nth-child(1) {
          stroke: #8b5cf6 !important;
          stroke-width: 3.5px !important;
          fill: #f5f3ff !important;
        }
        .djs-palette {
          display: none !important;
        }
        /* Rainbow semantic colors for BPMN diagram shapes */
        .djs-element[data-element-id*="StartEvent"] .djs-visual > circle {
          stroke: #059669 !important;
          fill: #ecfdf5 !important;
          stroke-width: 2.5px !important;
        }
        .djs-element[data-element-id*="EndEvent"] .djs-visual > circle {
          stroke: #e11d48 !important;
          fill: #fff1f2 !important;
          stroke-width: 3px !important;
        }
        .djs-element[data-element-id*="Gateway"] .djs-visual > polygon {
          stroke: #d97706 !important;
          fill: #fffbeb !important;
          stroke-width: 2px !important;
        }
        .djs-element[data-element-id*="Task"] .djs-visual > rect {
          stroke: #4f46e5 !important;
          fill: #f8fafc !important;
          stroke-width: 2px !important;
          rx: 8px !important;
        }
        .djs-element[data-element-id*="Task"] .djs-visual > text {
          fill: #0f172a !important;
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
}
