import { ProcessIR, IRNode, IRFlow } from "./compiler";

interface ShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function layoutIRHorizontally(ir: ProcessIR): string {
  const { nodes, flows, loopPaths } = ir;

  const loopReturnFlowIds = new Set(loopPaths.map((lp) => lp.returnFlowId));

  // Determine standard shape dimensions
  const getDimensions = (node: IRNode): { width: number; height: number } => {
    if (node.type === "startEvent" || node.type === "endEvent") {
      return { width: 36, height: 36 };
    }
    if (node.type === "exclusiveGateway" || node.type === "parallelGateway") {
      return { width: 50, height: 50 };
    }
    return { width: 100, height: 80 };
  };

  // Topological ranking for forward DAG flows
  const ranks = new Map<string, number>();
  nodes.forEach((n) => ranks.set(n.id, 0));

  const startNode = nodes.find((n) => n.type === "startEvent") || nodes[0];
  if (startNode) {
    ranks.set(startNode.id, 0);
  }

  const forwardFlows = flows.filter((f) => !loopReturnFlowIds.has(f.id));

  // Relax ranks up to N times
  for (let iter = 0; iter < nodes.length + 5; iter++) {
    let changed = false;
    for (const flow of forwardFlows) {
      const srcRank = ranks.get(flow.sourceRef) ?? 0;
      const tgtRank = ranks.get(flow.targetRef) ?? 0;
      if (srcRank + 1 > tgtRank) {
        ranks.set(flow.targetRef, srcRank + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Assign lanes (Y offsets) for branch nodes
  const lanes = new Map<string, number>();
  nodes.forEach((n) => lanes.set(n.id, 0));

  // Find split gateways and assign lanes to their direct children
  const splitGateways = nodes.filter(
    (n) => n.type === "exclusiveGateway" || n.type === "parallelGateway"
  );

  for (const gw of splitGateways) {
    const outgoing = forwardFlows.filter((f) => f.sourceRef === gw.id);
    if (outgoing.length > 1) {
      // Split branches
      outgoing.forEach((flow, idx) => {
        const offset = idx === 0 ? -1 : idx === 1 ? 1 : idx;
        lanes.set(flow.targetRef, offset);
      });
    }
  }

  // Calculate coordinates
  const bounds = new Map<string, ShapeBounds>();
  const baseX = 140;
  const baseY = 180;
  const rankSpacing = 160;
  const laneSpacing = 120;

  for (const node of nodes) {
    const dim = getDimensions(node);
    const rank = ranks.get(node.id) ?? 0;
    const lane = lanes.get(node.id) ?? 0;

    const centerX = baseX + rank * rankSpacing;
    const centerY = baseY + lane * laneSpacing;

    bounds.set(node.id, {
      x: Math.round(centerX - dim.width / 2),
      y: Math.round(centerY - dim.height / 2),
      width: dim.width,
      height: dim.height,
    });
  }

  // Calculate waypoints for each flow
  const edgeWaypoints = new Map<string, Point[]>();
  let maxY = Math.max(...Array.from(bounds.values()).map((b) => b.y + b.height));
  const loopChannelY = maxY + 80;

  for (const flow of flows) {
    const src = bounds.get(flow.sourceRef);
    const tgt = bounds.get(flow.targetRef);

    if (!src || !tgt) continue;

    if (loopReturnFlowIds.has(flow.id)) {
      // Loop repeat flow routing backward underneath
      const pt1: Point = { x: Math.round(src.x + src.width / 2), y: src.y + src.height };
      const pt2: Point = { x: Math.round(src.x + src.width / 2), y: loopChannelY };
      const pt3: Point = { x: Math.round(tgt.x + tgt.width / 2), y: loopChannelY };
      const pt4: Point = { x: Math.round(tgt.x + tgt.width / 2), y: tgt.y + tgt.height };
      edgeWaypoints.set(flow.id, [pt1, pt2, pt3, pt4]);
    } else {
      // Forward flow
      const ptStart: Point = { x: src.x + src.width, y: Math.round(src.y + src.height / 2) };
      const ptEnd: Point = { x: tgt.x, y: Math.round(tgt.y + tgt.height / 2) };

      if (Math.abs(ptStart.y - ptEnd.y) < 5) {
        edgeWaypoints.set(flow.id, [ptStart, ptEnd]);
      } else {
        const midX = Math.round(ptStart.x + 20);
        edgeWaypoints.set(flow.id, [
          ptStart,
          { x: midX, y: ptStart.y },
          { x: midX, y: ptEnd.y },
          ptEnd,
        ]);
      }
    }
  }

  // Build BPMNDI XML
  const shapeXmls = nodes.map((node) => {
    const b = bounds.get(node.id)!;
    const isMarker =
      node.type === "exclusiveGateway" || node.type === "parallelGateway"
        ? ' isMarkerVisible="true"'
        : "";
    return `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}"${isMarker}>
        <dc:Bounds x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" />
      </bpmndi:BPMNShape>`;
  });

  const edgeXmls = flows.map((flow) => {
    const pts = edgeWaypoints.get(flow.id) || [];
    const ptsXml = pts
      .map((p) => `        <di:waypoint x="${p.x}" y="${p.y}" />`)
      .join("\n");
    return `      <bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}">
${ptsXml}
      </bpmndi:BPMNEdge>`;
  });

  const nodeXmls = nodes.map((node) => {
    const nameAttr = node.name ? ` name="${escapeXml(node.name)}"` : "";
    return `    <bpmn:${node.type} id="${node.id}"${nameAttr} />`;
  });

  const flowXmls = flows.map((flow) => {
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
  <bpmndi:BPMNDiagram id="BPMNDiagram_${escapeXml(ir.processId)}">
    <bpmndi:BPMNPlane id="BPMNPlane_${escapeXml(ir.processId)}" bpmnElement="${escapeXml(ir.processId)}">
${shapeXmls.join("\n")}
${edgeXmls.join("\n")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

