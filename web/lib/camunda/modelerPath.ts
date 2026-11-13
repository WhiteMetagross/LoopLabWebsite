import * as fs from "fs";
import * as path from "path";

/**
 * Portable detection of Camunda Modeler executable across environments.
 * Checks environment variable, standard Program Files, LocalAppData, and path fallbacks.
 */
export function findModelerExecutable(): string | null {
  const envPath = process.env.CAMUNDA_MODELER_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const standardCandidates: (string | null | undefined)[] = [
    "C:\\Program Files\\Camunda Modeler\\Camunda Modeler.exe",
    "C:\\Program Files (x86)\\Camunda Modeler\\Camunda Modeler.exe",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "camunda-modeler", "Camunda Modeler.exe")
      : null,
    // Portable fallback inside workspace parent labs if present
    "C:\\Users\\Xeron\\Desktop\\IIIT-ACourseWork\\BPMLabs\\camunda_with_tokens\\camunda-modeler-5.40.0-win-x64\\Camunda Modeler.exe",
  ];

  for (const candidate of standardCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}
