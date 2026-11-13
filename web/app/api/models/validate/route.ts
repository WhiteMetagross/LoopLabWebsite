import { NextRequest, NextResponse } from "next/server";
import { validateProcessIR } from "@/lib/bpmn/validator";
import { ProcessIR } from "@/lib/bpmn/compiler";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ir = body.ir as ProcessIR;
    if (!ir) {
      return NextResponse.json({ error: "Missing ProcessIR payload." }, { status: 400 });
    }
    const diagnostics = validateProcessIR(ir, body.spec);
    return NextResponse.json({ diagnostics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to validate model." }, { status: 500 });
  }
}
