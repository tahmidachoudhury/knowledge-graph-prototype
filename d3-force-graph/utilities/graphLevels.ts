import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { Hierarchy } from "./types";

export type NodeType = "macroArea" | "macroTopic" | "topic" | "qna";

export interface Row {
  id: string;
  type: NodeType;
  label: string;
  parentId?: string;
  macroArea: string;
  macroTopic?: string;
  topic?: string;
  relevance?: number; // 0–1
}

const MACRO_AREA_COLORS: Record<string, string> = {
  Environment: "#32c46c",
  Social: "#f6c342",
  Governance: "#7f6bff",
};

// 🔧 single FA2 helper – FA2 per CURRENT graph only
export function runFA2Layout(graph: Graph, iterations = 200) {
  const t0 = performance.now();
  if (graph.order === 0) return;
  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { iterations, settings });
  const t1 = performance.now();
  console.log("FA2 layout ms:", t1 - t0);
}

// LEVEL 0 – macro areas only
export function buildMacroAreasGraph(graph: Graph, hierarchy: Hierarchy) {
  graph.clear();

  const macroAreas = Object.values(hierarchy);

  macroAreas.forEach((macroArea, i) => {
    graph.addNode(macroArea.name, {
      id: macroArea.name, // node ID is the macro area name
      label: macroArea.name,
      nodeType: "macroArea",
      color: MACRO_AREA_COLORS?.[macroArea.name] || "#FA5A3D",
      x: Math.cos((2 * Math.PI * i) / macroAreas.length),
      y: Math.sin((2 * Math.PI * i) / macroAreas.length),
      size: 20,
    });
  });

  // optional: connect areas
  for (let i = 0; i < macroAreas.length; i++) {
    const a = macroAreas[i].name;
    const b = macroAreas[(i + 1) % macroAreas.length].name;

    if (!graph.hasEdge(a, b)) {
      graph.addEdge(a, b, { size: 1, color: "#e0e0e0" });
    }
  }
}

// LEVEL 1 – macro topics within one macro area
export function buildMacroTopicsGraph(
  graph: Graph,
  hierarchy: Hierarchy,
  macroAreaName: string
) {
  graph.clear();

  const macroArea = hierarchy[macroAreaName];
  if (!macroArea) return;

  const macros = Object.values(macroArea.areas); // MacroNode[]

  // 1️⃣ Centre macro area node
  graph.addNode(macroArea.name, {
    id: macroArea.name,
    label: macroArea.name,
    nodeType: "macroArea",
    x: 0,
    y: 0,
    size: 30,
    color: MACRO_AREA_COLORS?.[macroArea.name] || "#FA5A3D",
  });

  // 2️⃣ Macro topic nodes around it
  const radius = 5;
  macros.forEach((macro, i) => {
    const angle = (2 * Math.PI * i) / Math.max(macros.length, 1);

    // Use a composite ID to ensure uniqueness
    const macroTopicId = `${macroAreaName}::${macro.name}`;

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    graph.addNode(macroTopicId, {
      id: macroTopicId,
      label: macro.name,
      nodeType: "macroTopic",
      x,
      y,
      size: 18,
      color: MACRO_AREA_COLORS?.[macroArea.name] || "#FDB833",
    });

    graph.addEdge(macroArea.name, macroTopicId, {
      size: 1.5,
      color: "#bbbbbb",
    });
  });
}

// LEVEL 2 – one macro topic + its topics + QnA bubbles

export function buildTopicQnaGraph(
  graph: Graph,
  hierarchy: Hierarchy,
  macroAreaName: string,
  macroTopicName: string
) {
  graph.clear();

  // 1️⃣ Look up the macro area + macro topic in the prepared hierarchy
  const macroArea = hierarchy[macroAreaName];
  if (!macroArea) return;

  const macro = macroArea.areas[macroTopicName];
  if (!macro) return;

  // 2️⃣ Centre node = the macro topic
  const macroTopicNodeId = `${macroAreaName}::${macroTopicName}`;

  graph.addNode(macroTopicNodeId, {
    id: macroTopicNodeId,
    label: macro.name,
    nodeType: "macroTopic",
    x: 0,
    y: 0,
    size: 25,
    color: "#00bfa6",
  });

  // 3️⃣ Collect all QnAs across all topics and subtopics under this macro topic
  const qnas: any = [];
  Object.values(macro.topics).forEach((topic) => {
    Object.values(topic.subtopics).forEach((subtopic) => {
      subtopic.qnas.forEach((qna) => {
        qnas.push({
          ...qna,
          topicName: topic.name,
          subtopicName: subtopic.name,
        });
      });
    });
  });

  if (qnas.length === 0) return;

  // 4️⃣ Lay QnAs out in a circle around the macro topic
  const radius = 6;

  qnas.forEach((qna: any, i: any) => {
    const angle = (2 * Math.PI * i) / qnas.length;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    const label =
      qna.question && qna.question.length > 80
        ? qna.question.slice(0, 77) + "..."
        : qna.question || qna.id;

    graph.addNode(qna.id, {
      id: qna.id,
      label,
      nodeType: "qna",
      x,
      y,
      size: 6, // if you later add relevance to QnaNode, plug it in here
      color: "#4fd5c6",
      question: qna.question,
      answer: qna.answer,
      topic: qna.topicName,
      subtopic: qna.subtopicName,
    });

    //This connects all qna nodes to the central macrotopic node
    graph.addEdge(macroTopicNodeId, qna.id, {
      size: 1,
      color: "rgba(140, 140, 140, 0.5)",
    });
  });
}
