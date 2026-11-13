import { test, expect } from "@playwright/test";

test.describe("Gemini 2.5 Flash Live Generation Integration", () => {
  test("generates valid BPMN 2.0 model with modeling decisions from natural language", async ({ request }) => {
    test.setTimeout(45000);

    const prompt =
      "A claim requests missing documents and assigns preparation team. After customer response, the claim can be resolved or require another document request cycle.";

    const res = await request.post("/api/models/generate", {
      data: { prompt },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();

    expect(data.spec).toBeDefined();
    expect(data.spec.status).toBe("ready");
    expect(data.spec.modelingDecisions.length).toBeGreaterThan(0);

    // Verify compiled BPMN XML contains definitions, process, and DI
    expect(data.xml).toContain("bpmn:process");
    expect(data.xml).toContain("bpmndi:BPMNDiagram");
    expect(data.xml).toContain("bpmndi:BPMNShape");

    // Verify diagnostics have no blocking errors
    const errors = (data.diagnostics || []).filter((d: any) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});

