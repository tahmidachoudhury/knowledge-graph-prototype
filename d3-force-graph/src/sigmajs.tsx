import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import circular from "graphology-layout/circular";
import dataRaw from "../data/qna_enriched.json"; // my dataset
import Stats from "stats.js";

const GraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const stats = new Stats();
    stats.showPanel(0); // 0: FPS, 1: ms, 2: mb
    document.body.appendChild(stats.dom);

    // 1️⃣ Create the graph
    const graph: Graph = new Graph();

    // measure graph building
    const t0 = performance.now();

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
      // if (!graph.hasNode(qnaId))
      //   graph.addNode(qnaId, {
      //     label: entry.question?.slice(0, 60) || qnaId,
      //     nodeType: "QnA",
      //     color: "#38A169",
      //   });

      if (!graph.hasEdge(macro, topic))
        graph.addEdge(macro, topic, { weight: 2 });
      if (!graph.hasEdge(topic, sub)) graph.addEdge(topic, sub, { weight: 2 });
      // if (!graph.hasEdge(sub, qnaId)) graph.addEdge(sub, qnaId, { weight: 2 });
    });

    // ... build nodes/edges ...
    const t1 = performance.now();
    console.log("Graph build ms (time taken to build nodes/edges):", t1 - t0);

    // 3️⃣ Layout: start circular → run ForceAtlas2
    circular.assign(graph);
    const settings = forceAtlas2.inferSettings(graph);
    const t2 = performance.now();
    forceAtlas2.assign(graph, { settings, iterations: 1000 });
    const t3 = performance.now();
    console.log("FA2 layout ms:", t3 - t2);

    console.table([
      { phase: "build", ms: t1 - t0 },
      { phase: "layout", ms: t3 - t2 },
    ]);

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

    // run fa2 layout
    const sensibleSettings = forceAtlas2.inferSettings(graph);
    const fa2Layout = new FA2Layout(graph, {
      settings: sensibleSettings,
    });
    fa2Layout.start();

    // render fps stats here
    renderer.on("beforeRender", () => {
      stats.begin();
    });

    renderer.on("afterRender", () => {
      stats.end();
    });

    // 6️⃣ Cleanup on unmount
    return () => {
      fa2Layout.kill();
      renderer.kill();
      document.body.removeChild(stats.dom);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="sigma-container"
      style={{
        width: "100%",
        height: "100vh",
        borderRadius: "12px",
        border: "1px solid #ddd",
      }}
    />
  );
};

export default GraphView;
