import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const processInstanceKey = `inst_${Date.now()}`;

    return NextResponse.json({
      status: "active",
      processInstanceKey,
      processDefinitionKey: body.processDefinitionKey || "def_1001",
      variables: body.variables || { caseId: 101, status: "pending" },
      activeTasks: [
        {
          elementId: "Task_req_docs",
          name: "Request Missing Documents",
          assignee: "demo_operator",
        },
      ],
      startedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start instance." }, { status: 500 });
  }
}
