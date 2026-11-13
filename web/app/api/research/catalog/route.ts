import { NextResponse } from "next/server";

export async function GET() {
  const domains = [
    {
      id: "SimClaims",
      name: "SimClaims (Document Request Preparation)",
      problem: "Document request cycles create reviewer queue backlogs.",
      interventionPoint: "Preparation team routing (standard vs. specialist)",
      primaryMetric: "Mean queue time (minutes)",
      baseline: "FIFO / Standard Regression",
      candidate: "Regression with episodic policy search",
      savedPaperGain: "6.28 minutes saved (11.25 percent gain)",
      sampleSize: "384 workloads per seed, 3 training seeds",
      operatingLimit: "< 0.50 additional attempts / 100 claims (actual: 0.322, passes)",
      exampleFile: "/examples/simclaims.bpmn",
    },
    {
      id: "BPISim",
      name: "BPISim (Incomplete Loan Review)",
      problem: "Incomplete review markers trigger repeat assessments.",
      interventionPoint: "Marker review routing",
      primaryMetric: "Total elapsed time (minutes)",
      baseline: "Regression",
      candidate: "Forced episodic policy search (sensitivity study)",
      savedPaperGain: "10.32 minutes saved (0.11 percent, 95% CI [-3.55, 28.66])",
      sampleSize: "384 workloads per seed, 3 training seeds",
      operatingLimit: "Validation retains Regression. Gain not confirmed.",
      exampleFile: "/examples/bpisim.bpmn",
    },
    {
      id: "SimFactory",
      name: "SimFactory (Repair and Reinspection)",
      problem: "Rework queues delay batches in manufacturing flow.",
      interventionPoint: "Repair team routing with accrued waiting state",
      primaryMetric: "Tail queue wait (8 longest waiting in 80 jobs)",
      baseline: "Regression",
      candidate: "Regression with safety constrained search",
      savedPaperGain: "50.29 tail minutes saved (7.30 percent gain)",
      sampleSize: "384 workloads per seed, 3 training seeds",
      operatingLimit: "Extra repairs increase by 0.405/100, upper bound (0.551) exceeds 0.50 limit.",
      exampleFile: "/examples/simfactory.bpmn",
    },
    {
      id: "SimBank",
      name: "SimBank (Repeated Loan Offers)",
      problem: "Repeated rate offers impact refusal rates and net revenue.",
      interventionPoint: "Offer rate selection (5 to 9 percent) up to 3 rounds",
      primaryMetric: "Refusals per 100 negotiations",
      baseline: "Regression based dynamic planner",
      candidate: "Regression informed Conservative Q-Learning (CQL)",
      savedPaperGain: "5.75 fewer refusals/100 (22.95 percent reduction)",
      sampleSize: "30,000 cases per seed, 3 training seeds",
      operatingLimit: "Profit change is 6.92 units [-67.93, 93.57], unresolved gain/loss.",
      exampleFile: "/examples/simbank.bpmn",
    },
  ];

  return NextResponse.json({ domains });
}
