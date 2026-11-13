import { NextResponse } from "next/server";
import { findModelerExecutable } from "@/lib/camunda/modelerPath";

export async function GET() {
  const modelerPath = findModelerExecutable();
  const modelerInstalled = modelerPath !== null;

  return NextResponse.json({
    enabled: true,
    modelerInstalled,
    modelerPath: modelerPath || "Camunda Modeler not found in standard paths",
    expectedVersion: process.env.CAMUNDA_EXPECTED_VERSION || "8.8",
    restAddress: process.env.CAMUNDA_REST_ADDRESS || "http://localhost:8080",
    clusterConnected: false,
    environment: "Localhost Development and Desktop Modeler",
  });
}
