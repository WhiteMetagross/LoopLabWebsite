import { test, expect } from "@playwright/test";

test.describe("LoopLab Research Workbench End-to-End Tests", () => {
  test("Overview page renders title and 4 domain cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Learning Based Interventions");
    await expect(page.getByText("SimClaims (Document Request Preparation)")).toBeVisible();
    await expect(page.getByText("BPISim (Incomplete Loan Review)")).toBeVisible();
    await expect(page.getByText("SimFactory (Repair and Reinspection)")).toBeVisible();
    await expect(page.getByText("SimBank (Repeated Loan Offers)")).toBeVisible();
  });

  test("Model page renders BPMN canvas and 'Why this model' rationale", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

    await page.goto("/model");
    await expect(page.getByText(/Rationale|Why this model/)).toBeVisible();
    await expect(page.getByText("Modeling Decisions:")).toBeVisible();
    await expect(page.getByText("Natural Language Description:")).toBeVisible();
  });

  test("Simulate page renders token simulation, research trace, and Camunda view", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

    await page.goto("/simulate");
    await expect(page.getByText("Browser Token Playback")).toBeVisible();
    await expect(page.getByText("Research Workload Trace")).toBeVisible();
    await expect(page.getByRole("button", { name: "Camunda 8 Engine" })).toBeVisible();

    // Switch to Research Workload Trace
    await page.getByRole("button", { name: "Research Workload Trace" }).click();
    await expect(page.getByText("Calibrated Workload Queue Replay")).toBeVisible();
    await page.getByRole("button", { name: "Run Workload Simulation" }).click();
    await expect(page.getByText("Baseline Mean Queue:")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Case 0 Chronological Event Trace:")).toBeVisible();

    // Switch to Camunda Engine view
    await page.getByRole("button", { name: "Camunda 8 Engine" }).click();
    await expect(page.getByText("Camunda 8 Engine Gateway")).toBeVisible();
    await expect(page.getByText("Installed (v5.40.0)")).toBeVisible();
  });

  test("Optimize page shows comparison charts and policy overlay", async ({ page }) => {
    await page.goto("/optimize");
    await expect(page.getByText("Intervention Policy Overlay on BPMN:")).toBeVisible();
    await expect(page.getByText("Mean queue time")).toBeVisible();
    await expect(page.getByText("Paired 95% Confidence Interval:")).toBeVisible();
  });

  test("Results page displays Table III and Table IV with ablations", async ({ page }) => {
    await page.goto("/results");
    await expect(page.getByText("Table III: Focused Held Out Comparisons")).toBeVisible();
    await expect(page.getByText("Table IV: Component, Timing, Reward and Logging Ablations")).toBeVisible();
    await expect(page.getByText("SimClaims").first()).toBeVisible();
    await expect(page.getByText("SimBank").first()).toBeVisible();
  });

  test("Research page displays domain simulator specifications and data provenance", async ({ page }) => {
    await page.goto("/research");
    await expect(page.getByText("Four Specialized Simulation Environments:")).toBeVisible();
    await expect(page.getByText("SimClaims (Document Request Cycle)")).toBeVisible();
    await expect(page.getByText("Data Provenance & Ethical Acquisition")).toBeVisible();
    await expect(page.getByText("Mendeley Data")).toBeVisible();
  });
});
