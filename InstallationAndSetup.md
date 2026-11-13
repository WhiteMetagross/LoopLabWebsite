# Installation and Setup Guide:

This document describes the environment prerequisites, automated setup sequence, dependency installation, and service startup for the LoopLab research workbench.

## Quick Start (Automated One Click Setup):

For convenience on any Windows machine, automated setup and startup scripts are provided in the repository root.

### 1. Run Setup:

Run the batch script or PowerShell script to install Python dependencies, configure environment variables, and install web packages:

```cmd
setup.bat
```

Or using PowerShell:

```powershell
.\setup.ps1
```

### 2. Launch LoopLab:

Start both the backend research simulation service and the web application with a single command:

```cmd
start.bat
```

Or using PowerShell:

```powershell
.\start.ps1
```

This starts the Python research service on `http://localhost:8000`, the Next.js application on `http://localhost:3000`, and opens your default browser automatically.

## System Prerequisites:

- Operating system: Windows 10 or Windows 11 host (Linux and macOS also supported).
- Node.js runtime: Node version 18.x, 20.x, or 22.x.
- Package manager: npm version 9.x or higher.
- Python runtime: Python version 3.9 through 3.13 (native Windows or WSL).
- Desktop application: Camunda Modeler version 5.x (optional, for local BPMN editing).
- API credentials: Google AI Studio Gemini API key with access to Gemini 2.5 Flash.

## Repository Layout and Directory Organization:

The LoopLab research demonstration workspace is self contained under the repository root.

- [web](web): Next.js front end, BPMN rendering canvas, and API routes.
- [services/research_api](services/research_api): FastAPI Python research service running discrete event simulations.
- [prompts](prompts): Versioned system instructions for Gemini BPMN compiler and result explainer.
- [fixtures](fixtures): Precompiled standard BPMN 2.0 XML diagrams and ProcessSpec contracts for research presets.
- [scripts](scripts): Data extraction and numerical verification utilities.
- [screenshots](screenshots): Captured page renders across desktop, tablet, and mobile viewports.

## Manual Step by Step Installation:

If you prefer to configure components manually, follow the sequence below.

### Step 1: Python Research Service Setup:

The Python research simulator runs on any standard Python environment with FastAPI and Uvicorn.

1. Navigate to the research service folder:
```powershell
Set-Location "services\research_api"
```

2. Install dependencies:
```powershell
python -m pip install -r requirements.txt
```

3. Start the FastAPI research service:
```powershell
python main.py
```

4. Confirm the service is active by requesting the health check endpoint:
```powershell
curl http://localhost:8000/health
```
The endpoint returns a JSON payload confirming healthy status and listing supported research domains.

### Step 2: Environment Configuration:

The Next.js web application reads configuration variables from `web/.env`.

1. Copy the example template if not already present:
```powershell
Copy-Item "web\.env.example" "web\.env"
```

2. The default configuration includes:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
RESEARCH_API_URL=http://localhost:8000
CAMUNDA_EXECUTION_ENABLED=true
CAMUNDA_EXPECTED_VERSION=8.8
CAMUNDA_REST_ADDRESS=http://localhost:8080
CAMUNDA_MODELER_PATH=
```

### Step 3: Web Dependencies Installation:

1. Install all node packages:
```powershell
Set-Location "web"
npm install
```

2. Confirm key packages are installed:
- Next.js version 15.
- React version 19.
- bpmn js and bpmn js token simulation.
- bpmn auto layout.
- Google GenAI SDK.
- Lucide React icon suite.
- Recharts data visualization suite.
- Playwright testing runner.

### Step 4: Running the Web Application:

1. In development mode with live hot reloading:
```powershell
npm run dev
```

2. Or compile the production bundle:
```powershell
npm run build
npm run start
```
The web application is active at `http://localhost:3000`.

### Step 5: Camunda Desktop Modeler Integration:

LoopLab integrates directly with any installed Camunda Desktop Modeler application.

1. Install Camunda Modeler from the official Camunda downloads page if desired.
2. The system automatically searches standard installation locations:
- `C:\Program Files\Camunda Modeler\Camunda Modeler.exe`
- `%LOCALAPPDATA%\Programs\camunda-modeler\Camunda Modeler.exe`
- Or any custom path specified in `CAMUNDA_MODELER_PATH` inside `web/.env`.
3. When the Open in Camunda Modeler button is pressed on the Model or Simulate page, the server writes the active BPMN XML to a temporary file and spawns the Modeler process directly.

### Step 6: Automated End to End Verification:

Verify complete functionality across models, charts, simulations, and live Gemini generation using the Playwright suite.

1. Execute the Playwright tests using system Chrome:
```powershell
Set-Location "web"
npx playwright test
```

2. Expected test output:
All seven automated tests pass, confirming overview card rendering, horizontal BPMN generation, rationale tabs, workload simulation execution, live Gemini 2.5 Flash API calls, and Table III and Table IV audited metrics.

## Troubleshooting and Diagnostic Checks:

- Port 3000 already in use: Stop existing node processes or launch on an alternative port by passing the port parameter to next start.
- Port 8000 already in use: Check whether uvicorn is running in another terminal and restart it.
- Python research service not reachable: Ensure `python main.py` is running on port 8000 before clicking workload simulation in the browser.
- Gemini API quota limit: Verify the API key status in Google AI Studio if live generation calls encounter rate limits.

## Next Steps:

For comprehensive instructions on process modeling, token simulations, intervention policy optimization, and research result auditing, proceed to [Usage.md](Usage.md).
