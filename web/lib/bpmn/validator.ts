import { ProcessIR } from "./compiler";
import { ProcessSpec } from "../contracts/processSpec";

export interface Diagnostic {
  ruleId: string;
  severity: "error" | "warning" | "info";
  message: string;
  elementId?: string;
}

export function validateProcessIR(ir: ProcessIR, spec?: ProcessSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Check unique IDs
  const idSet = new Set<string>();
  for (const node of ir.nodes) {
    if (idSet.has(node.id)) {
      diagnostics.push({
        ruleId: "duplicate_id",
        severity: "error",
        message: `Duplicate element ID: ${node.id}.`,
        elementId: node.id,
      });
    }
    idSet.add(node.id);
  }
  for (const flow of ir.flows) {
    if (idSet.has(flow.id)) {
      diagnostics.push({
        ruleId: "duplicate_id",
        severity: "error",
        message: `Duplicate sequence flow ID: ${flow.id}.`,
        elementId: flow.id,
      });
    }
    idSet.add(flow.id);
  }

  // Check flow endpoints exist
  for (const flow of ir.flows) {
    if (!idSet.has(flow.sourceRef)) {
      diagnostics.push({
        ruleId: "dangling_flow_source",
        severity: "error",
        message: `Sequence flow ${flow.id} references non-existent source ${flow.sourceRef}.`,
        elementId: flow.id,
      });
    }
    if (!idSet.has(flow.targetRef)) {
      diagnostics.push({
        ruleId: "dangling_flow_target",
        severity: "error",
        message: `Sequence flow ${flow.id} references non-existent target ${flow.targetRef}.`,
        elementId: flow.id,
      });
    }
  }

  // Start events have no incoming flows, End events have no outgoing flows
  const incomingCount: Record<string, number> = {};
  const outgoingCount: Record<string, number> = {};
  for (const flow of ir.flows) {
    incomingCount[flow.targetRef] = (incomingCount[flow.targetRef] || 0) + 1;
    outgoingCount[flow.sourceRef] = (outgoingCount[flow.sourceRef] || 0) + 1;
  }

  for (const node of ir.nodes) {
    if (node.type === "startEvent" && (incomingCount[node.id] || 0) > 0) {
      diagnostics.push({
        ruleId: "start_event_incoming",
        severity: "error",
        message: `Start event ${node.id} cannot have incoming sequence flows.`,
        elementId: node.id,
      });
    }
    if (node.type === "endEvent" && (outgoingCount[node.id] || 0) > 0) {
      diagnostics.push({
        ruleId: "end_event_outgoing",
        severity: "error",
        message: `End event ${node.id} cannot have outgoing sequence flows.`,
        elementId: node.id,
      });
    }
  }

  // Domain specific check: SimFactory repeat reinspection
  if (spec?.researchBindingCandidate?.domain === "SimFactory") {
    const hasRepair = ir.nodes.some((n) => n.name.toLowerCase().includes("repair"));
    const hasInspection = ir.nodes.some((n) => n.name.toLowerCase().includes("inspect"));
    if (hasRepair && !hasInspection) {
      diagnostics.push({
        ruleId: "simfactory_missing_reinspection",
        severity: "error",
        message: "SimFactory repeat requires an explicit reinspection task after repair.",
      });
    }
  }

  return diagnostics;
}

