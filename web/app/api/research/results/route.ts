import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "public/research/paper_results.v1.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Paper results manifest not found." }, { status: 404 });
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json(content);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load paper results." }, { status: 500 });
  }
}
