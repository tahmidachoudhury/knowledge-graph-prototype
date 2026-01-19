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


export async function fetchSubtopicQnas(
  subtopicId: string,
  signal?: AbortSignal
): Promise<SubtopicQnaData> {
  const index = await fetchQnasIndex(signal);

  const entry = index.subtopics.find((s) => s.id === subtopicId);
  console.log(entry)
  if (!entry) {
    throw new Error(`Subtopic not found in QnA index: ${subtopicId}`);
  }

  const res = await fetch(`/qnas/${entry.file}`);
  console.log(entry.file)
  if (!res.ok) throw new Error(`Failed to load QnA file (${res.status})`);

  const payload = await res.json();
  console.log(payload.nodes)
  const qnaNodes = payload.nodes.filter(
    (node: any) => node.group === "QnA"
  );


  return {
    centerNode: { id: entry.id, label: entry.label, group: "Subtopic", macroArea: entry.macroArea, macrotopic: entry.macrotopic },
    nodes: (qnaNodes) ?? undefined,
    // if your per-subtopic file includes links, you can pass them through:
    links: (payload?.links as any) ?? undefined,
  };
}
