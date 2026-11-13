import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const researchUrl = process.env.RESEARCH_API_URL || "http://localhost:8000";

    try {
      const resp = await fetch(`${researchUrl}/api/research/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    const attempt = body.attempt || 1;
    const standardJobs = body.standardJobs || 0;
    const specialistJobs = body.specialistJobs || 0;
    const recommendedAction = attempt > 1 && specialistJobs <= standardJobs ? "specialist" : "standard";

    return NextResponse.json({
      domain: body.domain || "SimClaims",
      attempt,
      predictedRepeatRisk: attempt === 1 ? 0.135 : 0.25,
      standardWaitEstimateMinutes: standardJobs * 15.0,
      specialistWaitEstimateMinutes: specialistJobs * 15.0,
      recommendedAction,
      controllerRationale: "Congestion aware routing assigns specialist when queue is available on repeat attempt.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Prediction failed." }, { status: 500 });
  }
}
