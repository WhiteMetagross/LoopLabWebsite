/**
 * Versioned ProcessSpec contracts for LoopLab.
 */

export interface ProcessVariable {
  name: string;
  type: "boolean" | "number" | "string" | "enum";
  description?: string;
  initialValue?: boolean | number | string;
  allowedValues?: string[];
}

export type BlockType =
  | "sequence"
  | "task"
  | "exclusive_choice"
  | "parallel"
  | "repeat"
  | "terminal";

export interface ExpressionNode {
  type: "literal" | "variable" | "binary_op" | "unary_op";
  value?: boolean | number | string;
  variableName?: string;
  operator?: "==" | "!=" | "<" | "<=" | ">" | ">=" | "and" | "or" | "not";
  left?: ExpressionNode;
  right?: ExpressionNode;
  operand?: ExpressionNode;
}

export interface ChoiceBranch {
  id: string;
  name: string;
  targetBlockId: string;
  condition?: ExpressionNode;
}

export interface ParallelBranch {
  id: string;
  name?: string;
  childBlockId: string;
}

export interface ControlBlock {
  id: string;
  type: BlockType;
  name: string;
  role?: string;
  taskType?: "user" | "service" | "business_rule" | "manual";
  orderedChildren?: string[]; // For sequence
  branches?: ChoiceBranch[]; // For exclusive_choice
  defaultBranchId?: string; // For exclusive_choice default
  parallelBranches?: ParallelBranch[]; // For parallel
  bodyBlockId?: string; // For repeat
  repeatCondition?: ExpressionNode; // For repeat condition
  outcome?: string; // For terminal
}

export interface ModelingDecision {
  id: string;
  choice: string;
  justification: string;
  affectedBlockIds: string[];
  references: string[];
  materialAlternatives?: string[];
}

export interface ProcessSpec {
  schemaVersion: "1.0.0";
  status: "ready" | "needs_clarification" | "unsupported";
  title: string;
  description: string;
  profile: "standard_looplab_v1";
  processId: string;
  rootBlockId: string;
  roles: string[];
  variables: ProcessVariable[];
  blocks: Record<string, ControlBlock>;
  assumptions: string[];
  modelingDecisions: ModelingDecision[];
  changeSummary?: string;
  clarificationQuestions?: string[];
  unsupportedRequirements?: string[];
  researchBindingCandidate?: {
    domain: "SimClaims" | "BPISim" | "SimFactory" | "SimBank";
    roleMappings: Record<string, string>;
  };
}

