# CodeBase Index and Architecture Guide:

This document provides a technical directory index, subsystem breakdown, component catalogue, and contract specification for the LoopLab demonstration workbench.

## Architectural Layers:

The application operates as a three tier system combining browser execution, server side generation, and Python discrete event research engines.

1. Presentation Layer (Browser Client):
   Built with Next.js App Router, React 19, Tailwind CSS, bpmn js for interactive BPMN rendering, bpmn js token simulation for token playback, and Recharts for queue comparison charts with paired 95 percent confidence intervals.

2. Application and Orchestration Layer (Next.js Server):
   Houses Backend For Frontend (BFF) API routes that handle Gemini 2.5 Flash prompt orchestration, schema validation, bounded repair loops, Camunda Desktop Modeler launching, and paper manifest generation.

3. Research Engine Layer (Python Research Service):
   FastAPI microservice executing discrete event simulations and empirical replay over calibrated domain data. Runs in standard Windows Python, Conda, or WSL.

## Directory Structure:

```
LoopLabProject/
├── setup.bat                    # One click automated installation batch script
├── setup.ps1                    # One click automated installation PowerShell script
├── start.bat                    # One click dual service launcher batch script
├── start.ps1                    # One click dual service launcher PowerShell script
├── InstallationAndSetup.md      # Comprehensive setup and troubleshooting manual
├── Usage.md                     # Stepwise user guide for all platform workflows
├── CodeBaseIndex.md             # Architecture overview and component directory
├── README.md                    # Project motivation, domain specifications, and quickstart
├── Visuals.md                   # Visual architecture, design tokens, and screenshot gallery
├── fixtures/                    # Standard precompiled BPMN XML files and JSON specifications
├── prompts/                     # Versioned Gemini prompt system instructions
├── screenshots/                 # Captured browser visual renders across devices
├── scripts/                     # Verification and data extraction scripts
├── services/
│   └── research_api/            # FastAPI Python research simulation service
│       ├── sim_engine/          # Bundled discrete event simulation engine
│       ├── data/                # Calibrated dataset files for standalone operation
│       ├── adapter.py           # Simulation adapter and trace generator
│       ├── main.py              # FastAPI service entry point
│       ├── requirements.txt     # Python dependency specifications
│       └── start.bat            # Portable service startup script
└── web/
    ├── app/                     # Next.js App Router pages and API routes
    ├── components/              # Modular UI components (BPMN, charts, layout)
    ├── lib/                     # Business logic, BPMN compiler, contracts, Gemini client
    ├── public/                  # Static assets, examples, and audited paper results
    ├── tests/                   # Playwright end to end and integration tests
    ├── .env.example             # Environment configuration template
    └── types.d.ts               # Ambient module declarations for BPMN packages
```

## Contract Definitions:

TypeScript interfaces ensure strict type safety across prompt outputs, compiler stages, and evaluation responses.

- [processSpec.ts](web/lib/contracts/processSpec.ts): Defines ProcessSpec, ControlBlock, ExpressionNode, VariableDeclaration, and ModelingDecision structures.
- [research.ts](web/lib/contracts/research.ts): Defines DomainPreset, MetricDefinition, EvaluationResponse, EvidenceBundle, and ExplanationSpec structures.
- [camunda.ts](web/lib/contracts/camunda.ts): Defines CamundaPreparationResult, DeploymentResponse, ProcessInstanceResponse, and ModelerStatus structures.

## BPMN Compiler and Layouter:

The compiler transforms high level structured process specifications into standard OMG BPMN 2.0 XML with complete layout coordinates.

- [compiler.ts](web/lib/bpmn/compiler.ts):
  - Function `compileSpecToIR`: Converts a ProcessSpec block tree into an intermediate representation (nodes, sequence flows, backward repeat paths).
  - Function `compileProcessSpec`: Orchestrates the IR transformation and coordinates horizontal diagram emission.
- [horizontalLayouter.ts](web/lib/bpmn/horizontalLayouter.ts):
  - Function `layoutIRHorizontally`: Computes horizontal coordinates, rank levels, branch vertical offsets, and orthogonal waypoints for loops and decisions. Emits BPMNDiagram and BPMNPlane tags.
- [validator.ts](web/lib/bpmn/validator.ts):
  - Function `validateProcessSpec`: Performs rule checks against profile standard looplab v1, validating reachability, loop endpoints, and required decisions.

## User Interface Components:

- [Header.tsx](web/components/workspace/Header.tsx): Top navigation banner containing the custom circular loop logo, system health chips, and rainbow signature tab links.
- [LoopLabLogo.tsx](web/components/workspace/LoopLabLogo.tsx): Brand logo component rendering the GenAI generated PNG image (`web/public/looplab_logo.png`) featuring two curved loop arrows (purple and green) on a white circular background.
- [BpmnCanvas.tsx](web/components/bpmn/BpmnCanvas.tsx): Dynamic client only wrapper for bpmn js avoiding server side rendering issues.
- [BpmnCanvasInner.tsx](web/components/bpmn/BpmnCanvasInner.tsx): Modeler instance management, module unwrapping for token simulation ESM classes, zoom controls, and semantic node color styling.
- [ComparisonCharts.tsx](web/components/charts/ComparisonCharts.tsx): Visual comparison bar chart rendering baseline control versus learned candidate with paired 95 percent confidence intervals and limit status pills.
- [ModelInspector.tsx](web/components/workspace/ModelInspector.tsx): Right side inspection drawer providing Rationale, Process Assumptions, and Validation gate diagnostics.
- [ResultExplainer.tsx](web/components/workspace/ResultExplainer.tsx): Grounded natural language interpretation drawer powered by Gemini 2.5 Flash with factual citation enforcement.

## Next.js Application Pages:

- [page.tsx (Overview)](web/app/page.tsx): Main research workbench entrance, three step research workflow guide, and four verified domain summary cards.
- [model/page.tsx (Modeler)](web/app/model/page.tsx): Interactive prompt engineering, model generation, conversational refinement, wide BPMN canvas, and rationale inspection.
- [simulate/page.tsx (Simulate)](web/app/simulate/page.tsx): Multi tab simulation view offering Browser Token Playback, Calibrated Workload Queue Replay, and Camunda 8 Engine Gateway.
- [optimize/page.tsx (Optimize)](web/app/optimize/page.tsx): Intervention policy overlay on BPMN, paired confidence interval comparison charts, and grounded Gemini result explanation.
- [results/page.tsx (Results)](web/app/results/page.tsx): Complete numerical reporting reproducing Table III (focused studies) and Table IV (ablations) with provenance download.
- [research/page.tsx (Research)](web/app/research/page.tsx): Formal research documentation, simulator definitions, mathematical mechanisms, data provenance DOIs, and evaluation protocol details.

## Server API Routes:

- [api/models/generate/route.ts](web/app/api/models/generate/route.ts): Invokes Gemini 2.5 Flash to generate a ProcessSpec from plain text descriptions.
- [api/models/refine/route.ts](web/app/api/models/refine/route.ts): Applies iterative modifications to an existing specification based on user requests.
- [api/models/validate/route.ts](web/app/api/models/validate/route.ts): Runs structural checks and profile gate rules against a ProcessSpec.
- [api/research/catalog/route.ts](web/app/api/research/catalog/route.ts): Returns metadata for the four research simulation domains.
- [api/research/results/route.ts](web/app/api/research/results/route.ts): Delivers verified paper numbers for Table III and Table IV from audited runs.
- [api/research/evaluate/route.ts](web/app/api/research/evaluate/route.ts): Dispatches live workload evaluation calls to the FastAPI research microservice.
- [api/research/explain/route.ts](web/app/api/research/explain/route.ts): Generates fact grounded explanations from Gemini using strict evidence bundles.
- [api/camunda/status/route.ts](web/app/api/camunda/status/route.ts): Inspects Camunda Modeler executable presence and Zeebe REST endpoint reachability.
- [api/camunda/open-modeler/route.ts](web/app/api/camunda/open-modeler/route.ts): Spawns the installed Camunda Desktop Modeler executable with the current process diagram.
- [api/camunda/prepare/route.ts](web/app/api/camunda/prepare/route.ts): Prepares executable BPMN XML (`isExecutable="true"`) with authorization metadata.
- [api/camunda/deploy/route.ts](web/app/api/camunda/deploy/route.ts): Deploys prepared BPMN models to Camunda 8 Zeebe endpoints.
- [api/camunda/instances/route.ts](web/app/api/camunda/instances/route.ts): Starts process instances in Camunda 8 Zeebe clusters.

## Python Research Service:

- [main.py](services/research_api/main.py): FastAPI web server exposing health checks, domain catalog, simulation runs, and case traces.
- [adapter.py](services/research_api/adapter.py): Adapter interfacing with the discrete event simulator and loading empirical case logs.
- [requirements.txt](services/research_api/requirements.txt): Pinned package list for FastAPI, Uvicorn, NumPy, and Pydantic.

## Audited Paper Data and Offline Verification:

- [paper_results.v1.json](web/public/research/paper_results.v1.json): Canonical JSON file containing audited Table III comparisons, Table IV ablations, and data provenance.
- [export_paper_results.py](scripts/export_paper_results.py): Python script that parses raw experiment outputs from runs and reports to construct the canonical JSON manifest.
- [verify_demo_results.py](scripts/verify_demo_results.py): Verification script confirming that values in the manifest match audited experiment logs with zero deviation.
