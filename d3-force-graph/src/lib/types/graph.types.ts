// src/lib/graphTypes.ts

export type NodeGroup =
  | "MacroArea"
  | "Macrotopic"
  | "Topic"
  | "Subtopic"
  | "Qna";

/**
 * Raw node shapes coming from main_graph.json
 * (Your JSON is not fully uniform, so keep this flexible but safe)
 */
export interface BaseGraphNode {
  id: string;
  label: string;
  group: NodeGroup;
  macroArea?: string;
  macrotopic?: string;
  topic?: string;
  // subtopic nodes implicitly represent a subtopic; for qna nodes, you'll have subtopicId etc.
}

export type MacroAreaNode = BaseGraphNode & {
  group: "MacroArea";
  macroArea?: string;
};
export type MacrotopicNode = BaseGraphNode & {
  group: "Macrotopic";
  macrotopic?: string;
};
export type TopicNode = BaseGraphNode & { group: "Topic"; topic?: string };
export type SubtopicNode = BaseGraphNode & {
  group: "Subtopic";
  topic?: string;
};
export type GraphNode =
  | MacroAreaNode
  | MacrotopicNode
  | TopicNode
  | SubtopicNode;

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

/**
 * D3 “hydrated” node/link typings
 */
export type D3Node = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

export type D3Link = Omit<GraphLink, "source" | "target"> & {
  source: string | D3Node;
  target: string | D3Node;
  index?: number;
};

/**
 * QnA data layer (from qnas/*.json)
 * Shape this to your actual QnA schema (keep it permissive for now).
 */
export interface QnaNode {
  id: string;
  question: string;
  answer?: string;
  metadata: {
    difficulty?: string; // e.g. "easy" | "medium" | "hard"
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface QnasIndexEntry {
  id: string; // subtopicId (matches Subtopic node id)
  label: string;
  qnaCount: number;
  macroArea?: string;
  macrotopic?: string;
  topic?: string;
  file: string; // filename in /public/qnas/
}

export interface QnasIndex {
  version: string;
  generatedAt: string;
  subtopics: QnasIndexEntry[];
}

/**
 * What SubtopicLanding expects
 */
export interface SubtopicQnaData {
  centerNode: { id: string; name: string };
  nodes: QnaNode[];
  links?: Array<{ source: string; target: string }>; // optional
}
