import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";

// Server side memory store for preparation records
const PREPARATION_STORE = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const xml = body.xml;
    if (!xml) {
      return NextResponse.json({ error: "Missing BPMN XML." }, { status: 400 });
    }

    // Ensure isExecutable=true for Camunda execution
    const executableXml = xml.replace('isExecutable="false"', 'isExecutable="true"');
    const semanticHash = createHash("sha256").update(xml).digest("hex");
    const executableHash = createHash("sha256").update(executableXml).digest("hex");
    const preparationId = `prep_${randomUUID()}`;

    const record = {
      preparationId,
      canonicalXml: executableXml,
      semanticHash,
      executableHash,
      processId: body.processId || "Process_1",
      targetAlias: "localhost-dev",
      tenant: "default",
      status: "prepared",
      createdAt: new Date().toISOString(),
      nonce: randomUUID(),
    };

    PREPARATION_STORE.set(preparationId, record);

    return NextResponse.json({
      preparationId,
      semanticHash,
      executableHash,
      status: "prepared",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to prepare execution." }, { status: 500 });
  }
}
