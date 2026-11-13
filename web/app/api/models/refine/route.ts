import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ProcessSpec } from "@/lib/contracts/processSpec";
import { compileProcessSpec } from "@/lib/bpmn/compiler";
import { validateProcessIR } from "@/lib/bpmn/validator";
import { callGeminiWithRetry } from "@/lib/gemini/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentSpec = body.spec as ProcessSpec;
    const changeRequest = body.changeRequest;
    if (!currentSpec || !changeRequest) {
      return NextResponse.json({ error: "Missing spec or changeRequest." }, { status: 400 });
    }

    const key = body.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY environment variable." }, { status: 400 });
    }
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const ai = new GoogleGenAI({ apiKey: key });

    const prompt = `Current ProcessSpec: ${JSON.stringify(currentSpec)}.
User change request: "${changeRequest}".
Refine the ProcessSpec by applying the requested change while preserving unchanged semantics and stable IDs. Return strictly updated ProcessSpec JSON with changeSummary populated.`;

    const res = await callGeminiWithRetry(ai, modelName, prompt, {
      responseMimeType: "application/json",
    });

    const parsedSpec = JSON.parse(res.text || "{}") as ProcessSpec;
    const { xml, ir } = await compileProcessSpec(parsedSpec);
    const diagnostics = validateProcessIR(ir, parsedSpec);

    return NextResponse.json({ spec: parsedSpec, xml, ir, diagnostics });
  } catch (err: any) {
    console.error("Error in /api/models/refine:", err);
    return NextResponse.json({ error: err.message || "Failed to refine model." }, { status: 500 });
  }
}
