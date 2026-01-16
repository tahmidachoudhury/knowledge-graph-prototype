// src/lib/graphData.ts

import type { QnasIndex, SubtopicQnaData, QnaNode } from "./types/graph.types";

/**
 * If you prefer importing main_graph.json directly in the component,
 * you don't need this function. It's here if you want runtime fetching.
 */
export async function fetchMainGraph(signal?: AbortSignal) {
  const res = await fetch("/data/main_graph.json", { signal });
  if (!res.ok) throw new Error(`Failed to load main graph (${res.status})`);
  return (await res.json()) as { nodes: any[]; links: any[] };
}

export async function fetchQnasIndex(signal?: AbortSignal): Promise<QnasIndex> {
  const res = await fetch("/qnas/index.json", { signal });
  if (!res.ok) throw new Error(`Failed to load QnA index (${res.status})`);
  return (await res.json()) as QnasIndex;
}

/**
 * You can shape the per-subtopic JSON however you like.
 * This loader tries to be robust:
 * - supports { qnas: [...] } or { qnaNodes: [...] } or [...]
 */
function extractQnas(payload: unknown): QnaNode[] {
  if (Array.isArray(payload)) return payload as QnaNode[];
  if (payload && typeof payload === "object") {
    const obj = payload as any;
    if (Array.isArray(obj.qnas)) return obj.qnas as QnaNode[];
    if (Array.isArray(obj.qnaNodes)) return obj.qnaNodes as QnaNode[];
    if (Array.isArray(obj.items)) return obj.items as QnaNode[];
  }
  return [];
}

export async function fetchSubtopicQnas(
  subtopicId: string,
  signal?: AbortSignal
): Promise<SubtopicQnaData> {
  const index = await fetchQnasIndex(signal);

  const entry = index.subtopics.find((s) => s.id === subtopicId);
  if (!entry) {
    throw new Error(`Subtopic not found in QnA index: ${subtopicId}`);
  }

  const res = await fetch(`/qnas/${entry.file}`, { signal });
  if (!res.ok) throw new Error(`Failed to load QnA file (${res.status})`);

  const payload = await res.json();
  const qnaNodes = extractQnas(payload);

  return {
    centerNode: { id: entry.id, name: entry.label },
    qnaNodes,
    // if your per-subtopic file includes links, you can pass them through:
    links: (payload?.links as any) ?? undefined,
  };
}
