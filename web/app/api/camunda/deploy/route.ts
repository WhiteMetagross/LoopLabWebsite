import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const preparationId = body.preparationId;
    if (!preparationId) {
      return NextResponse.json({ error: "Missing preparationId." }, { status: 400 });
    }

    const deploymentKey = `dep_${Date.now()}`;
    const processDefinitionKey = `def_${Math.floor(Math.random() * 1000000)}`;

    return NextResponse.json({
      status: "deployed",
      preparationId,
      deploymentKey,
      processDefinitionKey,
      tenantId: "default",
      version: 1,
      deployedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Deployment failed." }, { status: 500 });
  }
}
