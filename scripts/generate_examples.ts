import * as fs from "fs";
import * as path from "path";
import { compileProcessSpec } from "../web/lib/bpmn/compiler";
import { ProcessSpec } from "../web/lib/contracts/processSpec";

const outDir = path.resolve(__dirname, "../web/public/examples");
const fixtureDir = path.resolve(__dirname, "../fixtures");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(fixtureDir, { recursive: true });

// 1. SimClaims Spec
const simclaimsSpec: ProcessSpec = {
  schemaVersion: "1.0.0",
  status: "ready",
  title: "Document Request Preparation",
  description: "A claim requests missing documents and assigns preparation team before evaluation and potential rework.",
  profile: "standard_looplab_v1",
  processId: "Process_SimClaims",
  rootBlockId: "root_seq",
  roles: ["Claims Adjuster", "Preparation Specialist", "Customer"],
  variables: [
    { name: "attempt", type: "number", initialValue: 1 },
    { name: "team", type: "string", initialValue: "standard" },
    { name: "outcome", type: "string", initialValue: "pending" },
  ],
  blocks: {
    root_seq: {
      id: "root_seq",
      type: "sequence",
      name: "Main Claims Sequence",
      orderedChildren: ["repeat_block"],
    },
    repeat_block: {
      id: "repeat_block",
      type: "repeat",
      name: "Document Request Cycle",
      bodyBlockId: "cycle_seq",
      repeatCondition: {
        type: "binary_op",
        operator: "==",
        left: { type: "variable", variableName: "outcome" },
        right: { type: "literal", value: "another_request" },
      },
    },
    cycle_seq: {
      id: "cycle_seq",
      type: "sequence",
      name: "Cycle Sequence",
      orderedChildren: ["req_docs", "prep_choice", "cust_response", "assess_outcome"],
    },
    req_docs: {
      id: "req_docs",
      type: "task",
      name: "Request Missing Documents",
      role: "Claims Adjuster",
      taskType: "user",
    },
    prep_choice: {
      id: "prep_choice",
      type: "exclusive_choice",
      name: "Select Preparation Team",
      branches: [
        {
          id: "branch_std",
          name: "Standard Preparation",
          targetBlockId: "task_std_prep",
          condition: {
            type: "binary_op",
            operator: "==",
            left: { type: "variable", variableName: "team" },
            right: { type: "literal", value: "standard" },
          },
        },
        {
          id: "branch_spec",
          name: "Specialist Preparation",
          targetBlockId: "task_spec_prep",
          condition: {
            type: "binary_op",
            operator: "==",
            left: { type: "variable", variableName: "team" },
            right: { type: "literal", value: "specialist" },
          },
        },
      ],
      defaultBranchId: "branch_std",
    },
    task_std_prep: {
      id: "task_std_prep",
      type: "task",
      name: "Standard Document Preparation",
      role: "Claims Adjuster",
      taskType: "user",
    },
    task_spec_prep: {
      id: "task_spec_prep",
      type: "task",
      name: "Specialist Document Preparation",
      role: "Preparation Specialist",
      taskType: "user",
    },
    cust_response: {
      id: "cust_response",
      type: "task",
      name: "Receive Customer Response",
      role: "Customer",
      taskType: "user",
    },
    assess_outcome: {
      id: "assess_outcome",
      type: "task",
      name: "Assess Claim Outcome",
      role: "Claims Adjuster",
      taskType: "service",
    },
  },
  assumptions: [
    "Initial request count starts at 1.",
    "Specialist preparation shares reviewer capacity with other active claims.",
  ],
  modelingDecisions: [
    {
      id: "dec_1",
      choice: "Use exclusive choice for preparation team routing",
      justification: "A claim requires either standard or specialist preparation at each document request attempt.",
      affectedBlockIds: ["prep_choice"],
      references: ["Choose standard or specialist preparation."],
    },
    {
      id: "dec_2",
      choice: "Model document return as explicit repeat cycle",
      justification: "Customer responses that require further documentation repeat the preparation episode.",
      affectedBlockIds: ["repeat_block"],
      references: ["Another request returns to preparation."],
    },
  ],
  researchBindingCandidate: {
    domain: "SimClaims",
    roleMappings: {
      "task_std_prep": "standard_service",
      "task_spec_prep": "specialist_service",
      "prep_choice": "intervention_decision",
      "repeat_block": "repeat_decision",
    },
  },
};

// 2. BPISim Spec
const bpisimSpec: ProcessSpec = {
  schemaVersion: "1.0.0",
  status: "ready",
  title: "Incomplete Loan Review",
  description: "An application marked incomplete is routed to standard or specialist review.",
  profile: "standard_looplab_v1",
  processId: "Process_BPISim",
  rootBlockId: "root_seq",
  roles: ["Reviewer", "Senior Specialist"],
  variables: [
    { name: "attempt", type: "number", initialValue: 1 },
    { name: "reviewerType", type: "string", initialValue: "standard" },
    { name: "result", type: "string", initialValue: "incomplete" },
  ],
  blocks: {
    root_seq: {
      id: "root_seq",
      type: "sequence",
      name: "Main Review Sequence",
      orderedChildren: ["review_repeat"],
    },
    review_repeat: {
      id: "review_repeat",
      type: "repeat",
      name: "Incomplete Review Loop",
      bodyBlockId: "cycle_seq",
      repeatCondition: {
        type: "binary_op",
        operator: "==",
        left: { type: "variable", variableName: "result" },
        right: { type: "literal", value: "incomplete" },
      },
    },
    cycle_seq: {
      id: "cycle_seq",
      type: "sequence",
      name: "Cycle Sequence",
      orderedChildren: ["marker_task", "routing_choice", "validate_task"],
    },
    marker_task: {
      id: "marker_task",
      type: "task",
      name: "Record Incomplete Review Marker",
      role: "Reviewer",
      taskType: "service",
    },
    routing_choice: {
      id: "routing_choice",
      type: "exclusive_choice",
      name: "Assign Reviewer at Marker",
      branches: [
        {
          id: "b_std",
          name: "Standard Reviewer",
          targetBlockId: "t_std_rev",
        },
        {
          id: "b_spec",
          name: "Specialist Reviewer",
          targetBlockId: "t_spec_rev",
        },
      ],
      defaultBranchId: "b_std",
    },
    t_std_rev: {
      id: "t_std_rev",
      type: "task",
      name: "Standard Review Handling",
      role: "Reviewer",
      taskType: "user",
    },
    t_spec_rev: {
      id: "t_spec_rev",
      type: "task",
      name: "Specialist Review Handling",
      role: "Senior Specialist",
      taskType: "user",
    },
    validate_task: {
      id: "validate_task",
      type: "task",
      name: "Validate Application File",
      role: "Reviewer",
      taskType: "user",
    },
  },
  assumptions: [
    "Decision occurs at the incomplete marker rather than at service readiness.",
    "Review activity accounts for only 0.68 percent of total elapsed time.",
  ],
  modelingDecisions: [
    {
      id: "dec_bpi_1",
      choice: "Preserve marker timing before reviewer queue wait",
      justification: "Elapsed time is predominantly passive waiting outside the review decision.",
      affectedBlockIds: ["marker_task", "routing_choice"],
      references: ["An application enters when it is marked incomplete."],
    },
  ],
  researchBindingCandidate: {
    domain: "BPISim",
    roleMappings: {
      "routing_choice": "intervention_decision",
      "t_std_rev": "standard_service",
      "t_spec_rev": "specialist_service",
    },
  },
};

// 3. SimFactory Spec
const simfactorySpec: ProcessSpec = {
  schemaVersion: "1.0.0",
  status: "ready",
  title: "Manufacturing Repair and Reinspection",
  description: "A part needing repair is assigned to standard or specialist repair followed by mandatory reinspection.",
  profile: "standard_looplab_v1",
  processId: "Process_SimFactory",
  rootBlockId: "root_seq",
  roles: ["Repair Technician", "Specialist Tech", "Quality Inspector"],
  variables: [
    { name: "repairsCount", type: "number", initialValue: 1 },
    { name: "inspectionStatus", type: "string", initialValue: "needs_repair" },
  ],
  blocks: {
    root_seq: {
      id: "root_seq",
      type: "sequence",
      name: "Main Sequence",
      orderedChildren: ["repair_repeat", "pack_task"],
    },
    repair_repeat: {
      id: "repair_repeat",
      type: "repeat",
      name: "Repair and Reinspect Loop",
      bodyBlockId: "cycle_seq",
      repeatCondition: {
        type: "binary_op",
        operator: "==",
        left: { type: "variable", variableName: "inspectionStatus" },
        right: { type: "literal", value: "needs_repair" },
      },
    },
    cycle_seq: {
      id: "cycle_seq",
      type: "sequence",
      name: "Cycle Sequence",
      orderedChildren: ["repair_choice", "reinspect_task"],
    },
    repair_choice: {
      id: "repair_choice",
      type: "exclusive_choice",
      name: "Assign Repair Team",
      branches: [
        {
          id: "b_std_rep",
          name: "Standard Repair Team",
          targetBlockId: "t_std_repair",
        },
        {
          id: "b_spec_rep",
          name: "Specialist Repair Team",
          targetBlockId: "t_spec_repair",
        },
      ],
      defaultBranchId: "b_std_rep",
    },
    t_std_repair: {
      id: "t_std_repair",
      type: "task",
      name: "Execute Standard Repair",
      role: "Repair Technician",
      taskType: "user",
    },
    t_spec_repair: {
      id: "t_spec_repair",
      type: "task",
      name: "Execute Specialist Repair",
      role: "Specialist Tech",
      taskType: "user",
    },
    reinspect_task: {
      id: "reinspect_task",
      type: "task",
      name: "Reinspect Repaired Part",
      role: "Quality Inspector",
      taskType: "user",
    },
    pack_task: {
      id: "pack_task",
      type: "task",
      name: "Package Passed Part",
      role: "Quality Inspector",
      taskType: "manual",
    },
  },
  assumptions: [
    "Every repair must strictly be followed by reinspection before packing or another repair.",
    "Tail queue metric evaluates the 8 longest waiting jobs in an 80 job batch.",
  ],
  modelingDecisions: [
    {
      id: "dec_fac_1",
      choice: "Enforce mandatory reinspection after every repair iteration",
      justification: "Domain rules require reinspection milestone before packing or repeat repair.",
      affectedBlockIds: ["reinspect_task", "repair_repeat"],
      references: ["Every further repair must follow reinspection."],
    },
  ],
  researchBindingCandidate: {
    domain: "SimFactory",
    roleMappings: {
      "repair_choice": "intervention_decision",
      "t_std_repair": "standard_service",
      "t_spec_repair": "specialist_service",
      "reinspect_task": "milestone",
    },
  },
};

// 4. SimBank Spec
const simbankSpec: ProcessSpec = {
  schemaVersion: "1.0.0",
  status: "ready",
  title: "Repeated Loan Offers",
  description: "A customer negotiation where the bank selects interest offer rates with bounded attempts.",
  profile: "standard_looplab_v1",
  processId: "Process_SimBank",
  rootBlockId: "root_seq",
  roles: ["Loan Officer", "Customer"],
  variables: [
    { name: "offerCount", type: "number", initialValue: 1 },
    { name: "offerRate", type: "number", initialValue: 7 },
    { name: "customerAccepted", type: "boolean", initialValue: false },
  ],
  blocks: {
    root_seq: {
      id: "root_seq",
      type: "sequence",
      name: "Main Sequence",
      orderedChildren: ["negotiate_loop", "outcome_task"],
    },
    negotiate_loop: {
      id: "negotiate_loop",
      type: "repeat",
      name: "Offer Negotiation Loop",
      bodyBlockId: "offer_seq",
      repeatCondition: {
        type: "binary_op",
        operator: "==",
        left: { type: "variable", variableName: "customerAccepted" },
        right: { type: "literal", value: false },
      },
    },
    offer_seq: {
      id: "offer_seq",
      type: "sequence",
      name: "Offer Round",
      orderedChildren: ["calc_rate", "present_offer", "eval_response"],
    },
    calc_rate: {
      id: "calc_rate",
      type: "task",
      name: "Calculate Offer Rate (5 to 9 percent)",
      role: "Loan Officer",
      taskType: "service",
    },
    present_offer: {
      id: "present_offer",
      type: "task",
      name: "Present Rate to Customer",
      role: "Loan Officer",
      taskType: "user",
    },
    eval_response: {
      id: "eval_response",
      type: "task",
      name: "Evaluate Customer Response",
      role: "Customer",
      taskType: "user",
    },
    outcome_task: {
      id: "outcome_task",
      type: "task",
      name: "Finalize Negotiation Outcome",
      role: "Loan Officer",
      taskType: "service",
    },
  },
  assumptions: [
    "At most 3 offers are permitted before cancellation.",
    "Offer rates range between 5 and 9 percent.",
  ],
  modelingDecisions: [
    {
      id: "dec_bank_1",
      choice: "Model offer repeats as business negotiation iterations rather than error rework",
      justification: "Customer refusal is normal commercial negotiation behavior.",
      affectedBlockIds: ["negotiate_loop"],
      references: ["The bank can make another offer while the three offer limit permits."],
    },
  ],
  researchBindingCandidate: {
    domain: "SimBank",
    roleMappings: {
      "calc_rate": "intervention_decision",
      "eval_response": "standard_service",
    },
  },
};

// 5. Parallel Spec
const parallelSpec: ProcessSpec = {
  schemaVersion: "1.0.0",
  status: "ready",
  title: "Parallel Order Processing",
  description: "Check stock and payment concurrently before shipping.",
  profile: "standard_looplab_v1",
  processId: "Process_ParallelCheck",
  rootBlockId: "root_seq",
  roles: ["Warehouse", "Finance", "Shipping"],
  variables: [
    { name: "stockReady", type: "boolean", initialValue: true },
    { name: "paymentReady", type: "boolean", initialValue: true },
  ],
  blocks: {
    root_seq: {
      id: "root_seq",
      type: "sequence",
      name: "Order Processing Sequence",
      orderedChildren: ["recv_order", "para_check", "ship_order"],
    },
    recv_order: {
      id: "recv_order",
      type: "task",
      name: "Receive Order",
      role: "Warehouse",
      taskType: "user",
    },
    para_check: {
      id: "para_check",
      type: "parallel",
      name: "Concurrent Stock and Payment Verification",
      parallelBranches: [
        { id: "b_stock", childBlockId: "stock_task" },
        { id: "b_pay", childBlockId: "pay_task" },
      ],
    },
    stock_task: {
      id: "stock_task",
      type: "task",
      name: "Verify Inventory Stock",
      role: "Warehouse",
      taskType: "user",
    },
    pay_task: {
      id: "pay_task",
      type: "task",
      name: "Verify Payment Authorization",
      role: "Finance",
      taskType: "service",
    },
    ship_order: {
      id: "ship_order",
      type: "task",
      name: "Ship Goods to Customer",
      role: "Shipping",
      taskType: "manual",
    },
  },
  assumptions: [
    "Both stock check and payment verification must complete before shipping.",
  ],
  modelingDecisions: [
    {
      id: "dec_para_1",
      choice: "Use parallel gateway split and join",
      justification: "Both checks can occur independently and must synchronize before shipment.",
      affectedBlockIds: ["para_check"],
      references: ["Check stock and check payment in parallel."],
    },
  ],
};

async function generateAll() {
  const specs = [
    { filename: "simclaims.bpmn", spec: simclaimsSpec },
    { filename: "bpisim.bpmn", spec: bpisimSpec },
    { filename: "simfactory.bpmn", spec: simfactorySpec },
    { filename: "simbank.bpmn", spec: simbankSpec },
    { filename: "parallel.bpmn", spec: parallelSpec },
  ];

  for (const item of specs) {
    const { xml } = await compileProcessSpec(item.spec);
    const pubPath = path.join(outDir, item.filename);
    const fixPath = path.join(fixtureDir, item.filename);
    fs.writeFileSync(pubPath, xml, "utf-8");
    fs.writeFileSync(fixPath, xml, "utf-8");
    // Also save spec JSON
    const jsonName = item.filename.replace(".bpmn", ".json");
    fs.writeFileSync(path.join(outDir, jsonName), JSON.stringify(item.spec, null, 2), "utf-8");
    fs.writeFileSync(path.join(fixtureDir, jsonName), JSON.stringify(item.spec, null, 2), "utf-8");
    console.log(`Generated ${item.filename} with BPMNDiagram layout.`);
  }
}

generateAll().catch(console.error);

