import { layoutProcess } from "bpmn-auto-layout";
import { ControlBlock, ExpressionNode, ProcessSpec } from "../contracts/processSpec";
import { sanitizeProseText } from "../text/copyValidator";
import { layoutIRHorizontally } from "./horizontalLayouter";

export interface IRNode {
  id: string;
  type: "startEvent" | "endEvent" | "task" | "userTask" | "serviceTask" | "businessRuleTask" | "exclusiveGateway" | "parallelGateway";
  name: string;
  role?: string;
  blockId?: string;
}

export interface IRFlow {
  id: string;
  name?: string;
  sourceRef: string;
  targetRef: string;
  conditionExpression?: string;
  isDefault?: boolean;
}

export interface ProcessIR {
  processId: string;
  processName: string;
  isExecutable: boolean;
  nodes: IRNode[];
  flows: IRFlow[];
  loopPaths: { entryNodeId: string; repeatNodeId: string; returnFlowId: string }[];
}

export function formatExpression(expr?: ExpressionNode): string {
  if (!expr) return "";
  if (expr.type === "literal") {
    if (typeof expr.value === "string") return `"${expr.value}"`;
    return String(expr.value);
  }
  if (expr.type === "variable") {
    return expr.variableName || "var";
  }
  if (expr.type === "unary_op" && expr.operator === "not" && expr.operand) {
    return `not(${formatExpression(expr.operand)})`;
  }
  if (expr.type === "binary_op" && expr.operator && expr.left && expr.right) {
    return `${formatExpression(expr.left)} ${expr.operator} ${formatExpression(expr.right)}`;
  }
  return "";
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function compileSpecToIR(spec: ProcessSpec): ProcessIR {
  const nodes: IRNode[] = [];
  const flows: IRFlow[] = [];
  const loopPaths: { entryNodeId: string; repeatNodeId: string; returnFlowId: string }[] = [];

  const startId = "StartEvent_1";
  nodes.push({
    id: startId,
    type: "startEvent",
    name: "Start",
  });

  let flowCounter = 1;
  const nextFlowId = () => `Flow_${flowCounter++}`;

  // Recursive or structured block compiler
  function compileBlock(blockId: string, entryNodeId: string): string {
    const block = spec.blocks[blockId];
    if (!block) return entryNodeId;

    if (block.type === "task") {
      const taskId = `Task_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      let bpmnType: IRNode["type"] = "task";
      if (block.taskType === "user") bpmnType = "userTask";
      else if (block.taskType === "service") bpmnType = "serviceTask";
      else if (block.taskType === "business_rule") bpmnType = "businessRuleTask";

      nodes.push({
        id: taskId,
        type: bpmnType,
        name: sanitizeProseText(block.name || "Task"),
        role: block.role,
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: entryNodeId,
        targetRef: taskId,
      });

      return taskId;
    }

    if (block.type === "sequence") {
      let currentId = entryNodeId;
      const children = block.orderedChildren || [];
      for (const childId of children) {
        currentId = compileBlock(childId, currentId);
      }
      return currentId;
    }

    if (block.type === "exclusive_choice") {
      const splitId = `Gateway_Split_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      const mergeId = `Gateway_Merge_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;

      nodes.push({
        id: splitId,
        type: "exclusiveGateway",
        name: sanitizeProseText(block.name || "Decision"),
        blockId: block.id,
      });
      nodes.push({
        id: mergeId,
        type: "exclusiveGateway",
        name: "Merge",
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: entryNodeId,
        targetRef: splitId,
      });

      const branches = block.branches || [];
      for (const branch of branches) {
        const branchEntry = splitId;
        const branchEnd = compileBlock(branch.targetBlockId, branchEntry);

        // Update the flow from split to branch target with condition
        const existingFlow = flows.find(
          (f) => f.sourceRef === splitId && f.targetRef === branchEnd
        );
        if (existingFlow) {
          existingFlow.name = sanitizeProseText(branch.name);
          if (branch.condition) {
            existingFlow.conditionExpression = formatExpression(branch.condition);
          }
          if (block.defaultBranchId === branch.id) {
            existingFlow.isDefault = true;
          }
        }

        flows.push({
          id: nextFlowId(),
          sourceRef: branchEnd,
          targetRef: mergeId,
        });
      }

      return mergeId;
    }

    if (block.type === "parallel") {
      const splitId = `Gateway_ParaSplit_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      const joinId = `Gateway_ParaJoin_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;

      nodes.push({
        id: splitId,
        type: "parallelGateway",
        name: sanitizeProseText(block.name || "Parallel Split"),
        blockId: block.id,
      });
      nodes.push({
        id: joinId,
        type: "parallelGateway",
        name: "Parallel Join",
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: entryNodeId,
        targetRef: splitId,
      });

      const branches = block.parallelBranches || [];
      for (const branch of branches) {
        const branchEnd = compileBlock(branch.childBlockId, splitId);
        flows.push({
          id: nextFlowId(),
          sourceRef: branchEnd,
          targetRef: joinId,
        });
      }

      return joinId;
    }

    if (block.type === "repeat") {
      // Repeat block: body followed by repeat decision returning to loop entry
      const repeatEntryGatewayId = `Gateway_LoopEntry_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      const repeatDecisionGatewayId = `Gateway_RepeatCheck_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;

      nodes.push({
        id: repeatEntryGatewayId,
        type: "exclusiveGateway",
        name: "Loop Entry",
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: entryNodeId,
        targetRef: repeatEntryGatewayId,
      });

      let bodyEnd = repeatEntryGatewayId;
      if (block.bodyBlockId) {
        bodyEnd = compileBlock(block.bodyBlockId, repeatEntryGatewayId);
      }

      nodes.push({
        id: repeatDecisionGatewayId,
        type: "exclusiveGateway",
        name: sanitizeProseText(block.name || "Repeat Check"),
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: bodyEnd,
        targetRef: repeatDecisionGatewayId,
      });

      // Loop return flow back to loop entry
      const returnFlowId = nextFlowId();
      flows.push({
        id: returnFlowId,
        name: "Repeat",
        sourceRef: repeatDecisionGatewayId,
        targetRef: repeatEntryGatewayId,
        conditionExpression: formatExpression(block.repeatCondition) || "true",
      });

      loopPaths.push({
        entryNodeId: repeatEntryGatewayId,
        repeatNodeId: repeatDecisionGatewayId,
        returnFlowId,
      });

      return repeatDecisionGatewayId;
    }

    if (block.type === "terminal") {
      const endId = `EndEvent_${block.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
      nodes.push({
        id: endId,
        type: "endEvent",
        name: sanitizeProseText(block.outcome || block.name || "End"),
        blockId: block.id,
      });

      flows.push({
        id: nextFlowId(),
        sourceRef: entryNodeId,
        targetRef: endId,
      });

      return endId;
    }

    return entryNodeId;
  }

  const finalNodeId = compileBlock(spec.rootBlockId, startId);

  // If the last node is not an endEvent, connect it to a default end event
  const lastNode = nodes.find((n) => n.id === finalNodeId);
  if (lastNode && lastNode.type !== "endEvent") {
    const endId = "EndEvent_Completed";
    nodes.push({
      id: endId,
      type: "endEvent",
      name: "Completed",
    });
    flows.push({
      id: nextFlowId(),
      sourceRef: finalNodeId,
      targetRef: endId,
    });
  }

  return {
    processId: spec.processId || "Process_1",
    processName: sanitizeProseText(spec.title || "Business Process"),
    isExecutable: false,
    nodes,
    flows,
    loopPaths,
  };
}

export function serializeIRToSemanticXml(ir: ProcessIR): string {
  const nodeXmls = ir.nodes.map((node) => {
    const nameAttr = node.name ? ` name="${escapeXml(node.name)}"` : "";
    return `    <bpmn:${node.type} id="${node.id}"${nameAttr} />`;
  });

  const flowXmls = ir.flows.map((flow) => {
    const nameAttr = flow.name ? ` name="${escapeXml(flow.name)}"` : "";
    if (flow.conditionExpression) {
      return `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.sourceRef}" targetRef="${flow.targetRef}"${nameAttr}>
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${escapeXml(
        flow.conditionExpression
      )}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>`;
    }
    return `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.sourceRef}" targetRef="${flow.targetRef}"${nameAttr} />`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${escapeXml(ir.processId)}" name="${escapeXml(ir.processName)}" isExecutable="${ir.isExecutable}">
${nodeXmls.join("\n")}
${flowXmls.join("\n")}
  </bpmn:process>
</bpmn:definitions>`;
}

export async function compileProcessSpec(spec: ProcessSpec): Promise<{ xml: string; ir: ProcessIR }> {
  const ir = compileSpecToIR(spec);
  try {
    const horizontalXml = layoutIRHorizontally(ir);
    return { xml: horizontalXml, ir };
  } catch (err) {
    console.warn("Horizontal layout failed, falling back to auto layout:", err);
    const semanticXml = serializeIRToSemanticXml(ir);
    try {
      const layoutRes = await layoutProcess(semanticXml);
      const finalXml = typeof layoutRes === "string" ? layoutRes : (layoutRes as any).xml;
      return { xml: finalXml, ir };
    } catch {
      return { xml: semanticXml, ir };
    }
  }
}

