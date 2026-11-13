import { GoogleGenAI } from "@google/genai";
import { ProcessSpec } from "../contracts/processSpec";
import { compileProcessSpec, ProcessIR } from "../bpmn/compiler";
import { Diagnostic, validateProcessIR } from "../bpmn/validator";

const SYSTEM_INSTRUCTION = `You are the BPMN process designer for LoopLab. Create or refine a business process model from the user's description and the supplied ProcessSpec schema. Decide the supported activity structure, responsibilities, branches, concurrent work, repeat paths and outcomes.

Return JSON adhering to ProcessSpec. Return only JSON with these keys:
{
  "schemaVersion": "1.0.0",
  "status": "ready",
  "title": string,
  "description": string,
  "profile": "standard_looplab_v1",
  "processId": string,
  "rootBlockId": string,
  "roles": string[],
  "variables": [{"name": string, "type": "boolean"|"number"|"string"|"enum", "initialValue": any}],
  "blocks": {
    "block_id": {
      "id": string,
      "type": "sequence" | "task" | "exclusive_choice" | "parallel" | "repeat" | "terminal",
      "name": string,
      "role": optional string,
      "taskType": optional "user" | "service" | "business_rule" | "manual",
      "orderedChildren": optional string[] (for sequence),
      "branches": optional [{"id": string, "name": string, "targetBlockId": string, "condition": {"type": "literal"|"variable"|"binary_op", ...}}] (for exclusive_choice),
      "defaultBranchId": optional string,
      "parallelBranches": optional [{"id": string, "childBlockId": string}] (for parallel),
      "bodyBlockId": optional string (for repeat),
      "repeatCondition": optional {"type": "literal"|"variable"|"binary_op", ...} (for repeat),
      "outcome": optional string (for terminal)
    }
  },
  "assumptions": string[],
  "modelingDecisions": [
    {
      "id": string,
      "choice": string,
      "justification": string,
      "affectedBlockIds": string[],
      "references": string[]
    }
  ],
  "changeSummary": optional string,
  "clarificationQuestions": optional string[],
  "researchBindingCandidate": optional {
    "domain": "SimClaims" | "BPISim" | "SimFactory" | "SimBank",
    "roleMappings": {}
  }
}

Use simple technical English without emojis, em dashes, en dashes, or semicolons. Ensure the containment graph is acyclic.`;

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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: currentPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

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
        .join(" ")}. Please return a corrected ProcessSpec JSON.`;
    } catch (parseErr) {
      if (attempts > maxRepairs) {
        throw new Error(`Failed to parse Gemini response after ${attempts} attempts: ${String(parseErr)}`);
      }
      currentPrompt = `Original prompt: "${prompt}". Output was not valid JSON. Return strictly valid ProcessSpec JSON.`;
    }
  }

  throw new Error("Generation reached maximum repair attempts.");
}

