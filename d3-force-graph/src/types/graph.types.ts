// src/types/graph.types.ts

// ============================================================================
// Base Types
// ============================================================================

export type NodeGroup =
  | "MacroArea"
  | "Macrotopic"
  | "Topic"
  | "Subtopic"
  | "QnA";

export interface BaseNode {
  id: string;
  label: string;
  group: NodeGroup;
}

// ============================================================================
// Main Graph Node Types (matching your current structure)
// ============================================================================

export interface MacroAreaNode extends BaseNode {
  group: "MacroArea";
}

export interface MacrotopicNode extends BaseNode {
  group: "Macrotopic";
  macroArea: string;
}

export interface TopicNode extends BaseNode {
  group: "Topic";
  macroArea: string;
  macrotopic: string;
}

export interface SubtopicNode extends BaseNode {
  group: "Subtopic";
  macroArea: string;
  macrotopic: string;
  topic: string;
  qnaCount?: number; // Will be added during QnA generation
}

export interface QnaNode extends BaseNode {
  group: "QnA";
  question: string;
  answer: string;
  macroArea: string;
  macrotopic: string;
  topic: string;
  subtopic: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  viewCount?: number;
}

export type GraphNode =
  | MacroAreaNode
  | MacrotopicNode
  | TopicNode
  | SubtopicNode
  | QnaNode;

// ============================================================================
// Link Types
// ============================================================================

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

// ============================================================================
// Graph Data Structures
// ============================================================================

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface MainGraphData {
  nodes: Exclude<GraphNode, QnaNode>[]; // No QnA nodes in main graph
  links: GraphLink[];
}

export interface SubtopicQnaGraphData {
  nodes: (SubtopicNode | QnaNode)[]; // Center subtopic + QnA nodes
  links: GraphLink[];
}

// ============================================================================
// Raw Data Types (from qna_enriched.json)
// ============================================================================

export interface RawQnaEntry {
  Macrotopic: string;
  Topic: string;
  Subtopic: string;
  Question: string;
  Answer: string;
  Difficulty?: string;
  Tags?: string[];
  ViewCount?: number;
}

// ============================================================================
// D3 Simulation Node (with position data)
// ============================================================================

export type D3Node = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

export type D3Link = Omit<GraphLink, "source" | "target"> & {
  source: D3Node | string;
  target: D3Node | string;
  index?: number;
};

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface MainGraphProps {
  data: MainGraphData;
  onSubtopicClick: (subtopicId: string) => void;
}

export interface SubtopicLandingProps {
  subtopicId: string;
  mainGraphData: MainGraphData;
  onBack: () => void;
  onQnaClick: (qna: QnaNode) => void;
}

export interface QnaDetailPanelProps {
  qna: QnaNode;
  onClose: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseSubtopicQnasResult {
  data: SubtopicQnaGraphData | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilteredGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
