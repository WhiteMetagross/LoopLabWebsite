import { NextResponse } from "next/server";
import { findModelerExecutable } from "@/lib/camunda/modelerPath";

export async function GET() {
  const modelerPath = findModelerExecutable();
  const modelerInstalled = modelerPath !== null;

  const rawKey = process.env.GEMINI_API_KEY || "";
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const isKeyConfigured = Boolean(
    rawKey &&
    rawKey.trim().length > 10 &&
    !rawKey.includes("YOUR_GEMINI_API_KEY")
  );

  let researchApiConnected = false;
  const researchUrl = process.env.RESEARCH_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${researchUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(800),
    });
    researchApiConnected = res.ok;
  } catch {
    researchApiConnected = false;
  }

  return NextResponse.json({
    llm: {
      configured: isKeyConfigured,
      model: modelName,
      displayName: modelName.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      status: isKeyConfigured ? "ready" : "unconfigured",
    },
    camunda: {
      installed: modelerInstalled,
      path: modelerPath,
      status: modelerInstalled ? "installed" : "not_installed",
    },
    researchApi: {
      connected: researchApiConnected,
      status: researchApiConnected ? "connected" : "offline",
    },
    timestamp: new Date().toISOString(),
  });
}
