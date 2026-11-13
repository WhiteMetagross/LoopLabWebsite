# LoopLab User Guide and Stepwise Walkthrough:

This guide explains how to use the LoopLab demonstration platform to model cyclic business processes, execute simulations, analyze learned intervention policies, and inspect audited research findings.

## Overview and Purpose:

LoopLab provides an interactive interface for evaluating machine learning forecasters and reinforcement learning policies that intervene at repeated decision points in business processes.

The application contains five functional workbench stages:
1. Process Modeler: Natural language process synthesis and horizontal BPMN compilation.
2. Simulation Playground: Token simulation, empirical workload replay, and Camunda 8 gateway.
3. Policy Optimization: Visual policy overlays, paired confidence interval charts, and grounded Gemini explanations.
4. Audited Results: Reproduction of Table III comparisons and Table IV ablations.
5. Research Specifications: Mathematical mechanisms, simulator laws, and data provenance DOIs.

## Prerequisites and Quick Launch:

### Step 1: Run Automated Setup:

Open a terminal in the project root folder and execute the setup script:

```cmd
setup.bat
```

Or execute the PowerShell version:

```powershell
.\setup.ps1
```

The script verifies Node.js and Python runtimes, installs Python dependencies from `services/research_api/requirements.txt`, creates the configuration file `web/.env` from the template, and installs npm packages in `web`.

### Step 2: Configure API Credentials:

Open `web/.env` in any text editor and supply your Gemini API key:

```env
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
RESEARCH_API_URL=http://localhost:8000
```

### Step 3: Launch Services:

Start both backend and frontend servers with one command:

```cmd
start.bat
```

Or using PowerShell:

```powershell
.\start.ps1
```

The script starts the Python simulation service on port 8000, starts the Next.js application on port 3000, and opens your default browser at `http://localhost:3000`.

### Step 4: Verify Dynamic System Status:

Inspect the status indicator chips displayed in the top right corner of the navigation header:
- Gemini Status Chip: Displays the active model name and a pulsing green light when configured correctly. Displays Key Not Set with an alert marker if `GEMINI_API_KEY` is missing.
- Camunda Modeler Status Chip: Displays Installed with a green checkmark when the desktop Modeler executable is found. Displays Not Installed when the executable is absent from standard search locations.

## Step 1: Natural Language Process Modeling:

Navigate to the Model tab (`/model`) to create and modify BPMN process diagrams.

### 1. Load Starter Examples:

- Open the Starter Examples dropdown at the top of the left panel.
- Select from four verified research presets: SimClaims, BPISim, SimFactory, or SimBank.
- The system automatically loads the corresponding ProcessSpec JSON and renders the standard OMG BPMN 2.0 XML diagram horizontally.

### 2. Generate a Custom Model from Plain English:

- Enter a description of your business process in the Natural Language Description textarea.
- Describe tasks, XOR decisions, parallel gateways, and rework loops.
- Click the Generate BPMN Model button.
- Gemini 2.5 Flash analyzes your prompt, generates a validated ProcessSpec JSON structure, and compiles the model into standard OMG BPMN 2.0 XML with horizontal layout coordinates.

### 3. Inspect Modeling Rationale:

- Examine the Model Inspector drawer on the right side of the canvas.
- Click the Rationale tab to review explicit modeling decisions recorded during synthesis.
- Click the Assumptions tab to inspect domain parameter assumptions.
- Click the Validation tab to view profile compliance and node reachability checks.

### 4. Refine Models Iteratively:

- Use the Plain English Refinement input beneath the description panel.
- Type an incremental modification such as adding an escalation task or altering loop conditions.
- Click the Refine Model button.
- The system updates the existing specification while preserving stable identifiers and previous structure.

### 5. Export and Desktop Integration:

- Click the Download XML button to save the BPMN 2.0 XML file to your computer.
- Click the Open in Camunda Modeler button to launch the diagram directly in the installed Camunda desktop software.

## Step 2: Interactive Process Simulation:

Navigate to the Simulate tab (`/simulate`) to test process dynamics under different execution modes.

### 1. In Browser Token Simulation:

- Select the Token Simulation tab styled with the indigo badge.
- Click the Play button in the bottom canvas toolbar to start animated token movement.
- Observe tokens traverse sequence flows, split across gateways, and return along backward repeat paths.
- Use the pause button and speed slider to control simulation pacing.

### 2. Calibrated Workload Queue Replay:

- Select the Workload Trace tab styled with the emerald badge.
- Choose a domain from the dropdown: SimClaims, BPISim, SimFactory, or SimBank.
- Click the Run Simulation button to dispatch a bounded replay request to the Python research microservice.
- Review the summary comparison cards displaying baseline queue delay versus candidate queue delay.
- Inspect the Case Trace drawer to analyze case zero event sequences, timestamps, attempt counters, and specialist routing actions.

### 3. Camunda 8 Engine Gateway:

- Select the Camunda 8 Engine tab styled with the purple badge.
- Review desktop Modeler status and local Zeebe cluster connectivity.
- Follow the preparation steps to add execution authorization metadata (`isExecutable="true"`).
- Deploy verified models to local or cloud Camunda 8 clusters.

## Step 3: Intervention Policy Optimization:

Navigate to the Optimize tab (`/optimize`) to evaluate machine learning and reinforcement learning control policies.

### 1. Inspect Policy Canvas Overlay:

- View the horizontal BPMN diagram on the left panel.
- Notice the highlighted decision gateways and repeat loops where learning based controllers take actions.
- Review the banner describing the active policy mechanism and reward structure.

### 2. Compare Performance Metrics:

- Inspect the comparison bar chart on the right panel.
- The royal indigo bar represents the standard baseline control policy.
- The crimson rose bar represents the learned intervention policy.
- Compare mean queue times, turnaround durations, tail delays, or customer refusal rates across domains.

### 3. Verify Paired Confidence Intervals and Limits:

- Check the signed gain badge showing net metric improvement.
- Review the paired 95 percent bootstrap confidence interval.
- Inspect the secondary operating limit status pill to confirm that extra preparation or repair attempts remain within allowable bounds.

### 4. Generate Grounded Result Explanations:

- Click the Explain Findings with Gemini button.
- Gemini 2.5 Flash reviews the trusted evidence bundle and generates an objective narrative.
- The explanation summarizes primary gains, reports tradeoff metrics, cites numerical values rounded to two decimal places, and highlights statistical uncertainty without hallucination.

## Step 4: Auditing Research Results:

Navigate to the Results tab (`/results`) to examine numerical evidence.

### 1. Toggle Result Origin:

- Use the radio control at the top of the page to switch between Paper Published Baseline runs and Current Session Evaluated runs.

### 2. Inspect Table III (Focused Domain Comparisons):

- Review audited numbers across SimClaims, BPISim, SimFactory, and SimBank.
- Examine control policies, learned candidates, primary metric outcomes, signed gains, paired confidence intervals, and policy selection verdicts.

### 3. Inspect Table IV (Ablations and Timing Studies):

- Review twelve detailed ablation experiments examining queue congestion state, specialist capacity, reward weights, and timing limits.
- Filter rows by research domain using the domain filter selector.

### 4. Download Canonical Evidence:

- Click the Download Audited JSON button to export `web/public/research/paper_results.v1.json` containing complete numerical runs and metadata.

## Step 5: Research Documentation and Data Rights:

Navigate to the Research tab (`/research`) to inspect formal research specifications.

### 1. Domain Simulation Specifications:

- Review four detailed cards outlining domain setting, decision point, primary metric, mechanism, and constraints.

### 2. Data Provenance and DOIs:

- Verify institutional sources for insurance claims (Mendeley Data DOI 10.17632/kdcspz6xtn.1), manufacturing logs (4TU.ResearchData DOI 10.4121/uuid:68726926-5ac5-4fab-b873-ee76ea412399), and loan applications (4TU.ResearchData DOI 10.4121/uuid:5f3067df-f10b-45da-b98b-86ae4c7a310b).

### 3. Evaluation Rigor Protocol:

- Review the documentation on master seeds, held out test workloads, common random numbers, and paired difference estimation.

## Step 6: Automated Verification and Testing:

Run automated test suites to verify platform integrity.

### 1. Browser End to End Tests:

Run the Playwright test suite from the `web` folder:

```powershell
Set-Location "web"
npx playwright test
```

Expected result:
All seven automated tests pass, verifying page rendering, BPMN diagram compilation, token simulation, live workload replay, and live Gemini API generation.

### 2. Metric Verification Script:

Run the Python verification script from the project root:

```powershell
python scripts\verify_demo_results.py
```

Expected result:
The script compares values in `web/public/research/paper_results.v1.json` against raw experiment logs and reports zero discrepancies.

## Troubleshooting Common Issues:

- Gemini Status displays Key Not Set: Ensure `GEMINI_API_KEY` in `web/.env` contains a valid Google AI Studio key and restart the web server.
- Camunda Modeler displays Not Installed: Install Camunda Modeler in the standard Program Files directory or set `CAMUNDA_MODELER_PATH` in `web/.env` pointing to your executable.
- Python Simulation Service offline: Ensure `python services/research_api/main.py` is running on port 8000 before clicking Run Simulation on the Simulate page.
- Port 3000 collision: If another application occupies port 3000, specify an alternative port such as `npm run dev -- -p 3001` or terminate the existing node process.

