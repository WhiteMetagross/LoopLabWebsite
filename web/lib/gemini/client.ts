import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import { ProcessSpec } from "../contracts/processSpec";
import { compileProcessSpec } from "../bpmn/compiler";
import { validateProcessIR, Diagnostic } from "../bpmn/validator";
import { ProcessIR } from "../bpmn/compiler";

let SYSTEM_INSTRUCTION = `You are a strict BPMN compiler and business process architect.
Your goal is to parse a natural language process description into a formal, structured ProcessSpec JSON according to the looplab-v1 profile.
Return strictly valid JSON complying with the ProcessSpec schema.`;

try {
  const promptPath = path.resolve(process.cwd(), "../prompts/process-generator.system.md");
  if (fs.existsSync(promptPath)) {
    SYSTEM_INSTRUCTION = fs.readFileSync(promptPath, "utf-8");
  } else {
    const localPromptPath = path.resolve(process.cwd(), "prompts/process-generator.system.md");
    if (fs.existsSync(localPromptPath)) {
      SYSTEM_INSTRUCTION = fs.readFileSync(localPromptPath, "utf-8");
    }
  }
} catch (e) {
  // Fall back to default inline instruction
}

/**
 * Execute Gemini call with exponential backoff for transient 503/429 spikes.
 */
export async function callGeminiWithRetry(
  ai: GoogleGenAI,
  modelName: string,
  currentPrompt: string,
  config?: any,
  retries = 3
): Promise<any> {
  const reqConfig = config || {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
  };
  let delay = 1500;
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents: currentPrompt,
        config: reqConfig,
      });
    } catch (err: any) {
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        String(err).includes("503") ||
        String(err).includes("429") ||
        String(err).includes("high demand") ||
        String(err).includes("RESOURCE_EXHAUSTED");

      if (isTransient && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

export interface GenerateResult {
  spec: ProcessSpec;
  xml: string;
  ir: ProcessIR;
  diagnostics: Diagnostic[];
}

export async function generateProcessModel(
  prompt: string,
  apiKey?: string
): Promise<GenerateResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const ai = new GoogleGenAI({ apiKey: key });

  let rawJson = "";
  let attempts = 0;
  const maxRepairs = 2;
  let currentPrompt = prompt;

  while (attempts <= maxRepairs) {
    attempts++;
    const response = await callGeminiWithRetry(ai, modelName, currentPrompt);

    rawJson = response.text || "";
    try {
      const parsedSpec = JSON.parse(rawJson) as ProcessSpec;
      const { xml, ir } = await compileProcessSpec(parsedSpec);
      const diagnostics = validateProcessIR(ir, parsedSpec);

      const errors = diagnostics.filter((d) => d.severity === "error");
      if (errors.length === 0 || attempts > maxRepairs) {
        return { spec: parsedSpec, xml, ir, diagnostics };
      }

      // Repair prompt
      currentPrompt = `Original prompt: "${prompt}". Your prior specification had validation errors: ${errors
        .map((e) => e.message)
        .join(" ")}. Please return a corrected ProcessSpec JSON conforming strictly to schema.`;
    } catch (parseErr) {
      console.error(`Gemini parse/compile attempt ${attempts} error:`, parseErr);
      if (attempts > maxRepairs) {
        throw new Error(`Failed to parse Gemini response after ${attempts} attempts: ${String(parseErr)}`);
      }
      currentPrompt = `Original prompt: "${prompt}". The returned JSON failed compilation: ${String(
        parseErr
      )}. Please return strictly valid ProcessSpec JSON conforming to the schema with rootBlockId and blocks map.`;
    }
  }

  throw new Error("Generation reached maximum repair attempts.");
}
