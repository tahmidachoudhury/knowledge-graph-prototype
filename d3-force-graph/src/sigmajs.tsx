import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import dataRaw from "../data/qna_enriched.json"; // your dataset

const GraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1️⃣ Create the graph
    const graph: Graph = new Graph();

    // 2️⃣ Build hierarchy: Macrotopic → Topic → Subtopic → QnA
    const data = dataRaw as any[];
    data.forEach((entry) => {
      const macro = entry.Macrotopic?.trim() || "Unknown Macrotopic";
      const topic = entry.Topic?.trim() || "Unknown Topic";
      const sub = entry.Subtopic?.trim() || "Unknown Subtopic";
      const qnaId = entry.id || `QNA-${Math.random()}`;

      if (!graph.hasNode(macro))
        graph.addNode(macro, {
          label: macro,
          nodeType: "Macrotopic",
          color: "#FA5A3D",
        });
      if (!graph.hasNode(topic))
        graph.addNode(topic, {
          label: topic,
          nodeType: "Topic",
          color: "#FDB833",
        });
      if (!graph.hasNode(sub))
        graph.addNode(sub, {
          label: sub,
          nodeType: "Subtopic",
          color: "#5A75DB",
        });
      if (!graph.hasNode(qnaId))
        graph.addNode(qnaId, {
          label: entry.question?.slice(0, 60) || qnaId,
          nodeType: "QnA",
          color: "#38A169",
        });

      if (!graph.hasEdge(macro, topic))
        graph.addEdge(macro, topic, { weight: 2 });
      if (!graph.hasEdge(topic, sub)) graph.addEdge(topic, sub, { weight: 2 });
      if (!graph.hasEdge(sub, qnaId)) graph.addEdge(sub, qnaId, { weight: 2 });
    });

    // 3️⃣ Layout: start circular → run ForceAtlas2
    circular.assign(graph);
    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, { settings, iterations: 1000 });

    // 4️⃣ Size nodes based on degree
    const degrees = graph.nodes().map((node) => graph.degree(node));
    const minDegree = Math.min(...degrees);
    const maxDegree = Math.max(...degrees);
    const minSize = 2,
      maxSize = 10;

    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      graph.setNodeAttribute(
        node,
        "size",
        minSize +
          ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize)
      );
    });

    // 5️⃣ Initialize Sigma renderer
    const renderer = new Sigma(graph, containerRef.current);

    // 6️⃣ Cleanup on unmount
    return () => {
      renderer.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="sigma-container"
      style={{
        width: "100%",
        height: "90vh",
        borderRadius: "12px",
        border: "1px solid #ddd",
      }}
    />
  );
};

export default GraphView;
