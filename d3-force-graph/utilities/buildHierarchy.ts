// utils/buildHierarchy.ts

import { Hierarchy, QnaNode } from "./types";
import dataRaw from "../data/qna_enriched.json";

export function buildHierarchy(data: any[]): Hierarchy {
  const tree: Hierarchy = {};

  // measure graph building
  const t0 = performance.now();

  data.forEach((entry) => {
    const area = "Environment";
    const macro = entry.Macrotopic?.trim() || "Unknown Macrotopic";
    const topic = entry.Topic?.trim() || "Unknown Topic";
    const sub = entry.Subtopic?.trim() || "Unknown Subtopic";

    // Initialize MacroAreaNode if it doesn't exist
    if (!tree[area]) {
      tree[area] = { name: area, areas: {} };
    }

    // Initialize MacroNode within the area if it doesn't exist
    if (!tree[area].areas[macro]) {
      tree[area].areas[macro] = { name: macro, topics: {} };
    }

    // Initialize TopicNode within the macro if it doesn't exist
    if (!tree[area].areas[macro].topics[topic]) {
      tree[area].areas[macro].topics[topic] = { name: topic, subtopics: {} };
    }

    // Initialize SubtopicNode within the topic if it doesn't exist
    if (!tree[area].areas[macro].topics[topic].subtopics[sub]) {
      tree[area].areas[macro].topics[topic].subtopics[sub] = {
        name: sub,
        qnas: [],
      };
    }

    if (entry.question) {
      const qna: QnaNode = {
        id: entry.id || entry.qna_id,
        question: entry.question,
        answer: entry.answer,
      };

      tree[area].areas[macro].topics[topic].subtopics[sub].qnas.push(qna);
    }
  });
  const t1 = performance.now();

  console.log("Graph build ms (time taken to build nodes/edges):", t1 - t0);

  //   console.log(tree);
  return tree;
}
