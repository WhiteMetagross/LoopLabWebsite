import { NextRequest, NextResponse } from "next/server";
import { generateProcessModel } from "@/lib/gemini/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt string" }, { status: 400 });
    }

    const result = await generateProcessModel(prompt, body.apiKey);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in /api/models/generate:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate BPMN model from prompt." },
      { status: 500 }
    );
  }
}
