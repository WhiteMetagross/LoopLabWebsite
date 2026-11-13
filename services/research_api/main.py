"""FastAPI research simulation service for LoopLab."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn

from adapter import run_bounded_simulation

app = FastAPI(title="LoopLab Research API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EvaluateRequest(BaseModel):
    domain: str = Field(default="SimClaims")
    numCases: int = Field(default=15, ge=5, le=100)
    seed: int = Field(default=42)
    effect: float = Field(default=0.25, ge=0.0, le=1.0)


class PredictRequest(BaseModel):
    domain: str = Field(default="SimClaims")
    attempt: int = Field(default=1)
    standardJobs: int = Field(default=0)
    specialistJobs: int = Field(default=0)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "LoopLab Research Service",
        "supportedDomains": ["SimClaims", "BPISim", "SimFactory", "SimBank"],
        "capabilities": ["live_workload_simulation", "trace_replay", "bounded_evaluation"],
    }


@app.post("/api/research/predict")
def predict_state(req: PredictRequest):
    # Simulated calibrated predictor response based on domain and queue conditions
    prob_repeat = 0.135 if req.attempt == 1 else 0.25
    recommended_action = "standard"
    if req.attempt > 1 and req.specialistJobs <= req.standardJobs:
        recommended_action = "specialist"

    return {
        "domain": req.domain,
        "attempt": req.attempt,
        "predictedRepeatRisk": prob_repeat,
        "standardWaitEstimateMinutes": req.standardJobs * 15.0,
        "specialistWaitEstimateMinutes": req.specialistJobs * 15.0,
        "recommendedAction": recommended_action,
        "controllerRationale": "Congestion aware routing assigns specialist when queue is available on repeat attempt.",
    }


@app.post("/api/research/evaluate")
def evaluate_workload(req: EvaluateRequest):
    try:
        result = run_bounded_simulation(
            domain=req.domain,
            num_cases=req.numCases,
            seed=req.seed,
            effect=req.effect,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

