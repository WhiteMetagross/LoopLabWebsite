"use client";

import dynamic from "next/dynamic";
import React from "react";

const BpmnCanvasInner = dynamic(() => import("./BpmnCanvasInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-research-blue mx-auto mb-2" />
        <p>Loading BPMN Modeler and Token Playground...</p>
      </div>
    </div>
  ),
});

export default function BpmnCanvas(props: any) {
  return <BpmnCanvasInner {...props} />;
}

