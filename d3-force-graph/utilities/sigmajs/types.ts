// utils/types.ts

export interface QnaNode {
  id: string;
  question: string;
  answer: string;
}

export interface SubtopicNode {
  name: string;
  qnas: QnaNode[];
}

export interface TopicNode {
  name: string;
  subtopics: Record<string, SubtopicNode>;
}

export interface MacroNode {
  name: string;
  topics: Record<string, TopicNode>;
}

export interface MacroAreaNode {
  name: string;
  areas: Record<string, MacroNode>;
}

export type Hierarchy = Record<string, MacroAreaNode>;
