import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { findModelerExecutable } from "@/lib/camunda/modelerPath";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const xml = body.xml;
    if (!xml) {
      return NextResponse.json({ error: "Missing BPMN XML." }, { status: 400 });
    }

    const modelerExe = findModelerExecutable();
    if (!modelerExe) {
      return NextResponse.json(
        {
          error:
            "Camunda Modeler executable not found. Please install Camunda Modeler and set CAMUNDA_MODELER_PATH in web/.env or system environment.",
        },
        { status: 404 }
      );
    }

    const tmpDir = path.resolve(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    const targetFile = path.join(tmpDir, "looplab_active_process.bpmn");
    fs.writeFileSync(targetFile, xml, "utf-8");

    // Launch Camunda Modeler in background with the file
    const child = spawn(modelerExe, [targetFile], { detached: true, stdio: "ignore" });
    child.unref();

    return NextResponse.json({
      success: true,
      openedFile: targetFile,
      modelerExe,
      message: "Launched Camunda Modeler desktop application with current process model.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to launch Camunda Modeler." }, { status: 500 });
  }
}
