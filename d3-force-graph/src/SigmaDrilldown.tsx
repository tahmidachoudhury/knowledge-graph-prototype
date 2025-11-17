// SigmaDrilldown.tsx
import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";

import {
  Row,
  buildMacroAreasGraph,
  buildMacroTopicsGraph,
  buildTopicQnaGraph,
  runFA2Layout,
} from "../utilities/graphLevels";

import dataRaw from "../data/qna_enriched.json"; // my dataset
import { buildHierarchy } from "../utilities/buildHierarchy";

type Level = "macroAreas" | "macroTopics" | "topicQna";

export default function SigmaDrilldown() {
  const data = buildHierarchy(dataRaw as any[]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [level, setLevel] = useState<Level>("macroAreas");
  const [selectedMacroAreaId, setSelectedMacroAreaId] = useState<string | null>(
    null
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // init Sigma once
  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();
    const renderer = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelDensity: 0.08,
    });

    sigmaRef.current = renderer;

    // click drill-down handler
    renderer.on("clickNode", (event) => {
      const node = event.node;
      const attrs: any = graph.getNodeAttributes(node);
      //   console.log("clicked!", attrs);

      if (level === "macroAreas" && attrs.nodeType === "macroArea") {
        setSelectedMacroAreaId(attrs.id);
        setLevel("macroTopics");
      } else if (level === "macroTopics" && attrs.nodeType === "macroTopic") {
        setSelectedTopicId(attrs.id);
        setLevel("topicQna");
      } else if (level === "topicQna" && attrs.nodeType === "macroTopic") {
        // optional bubble-up on centre macro topic click
        setLevel("macroTopics");
        setSelectedTopicId(null);
      }
    });

    return () => {
      renderer.kill();
      sigmaRef.current = null;
    };
  }, [level]); // level used in handler

  // rebuild + layout whenever level / selection changes
  useEffect(() => {
    if (!sigmaRef.current) return;

    const renderer = sigmaRef.current;
    const graph = renderer.getGraph() as Graph;

    if (level === "macroAreas") {
      buildMacroAreasGraph(graph, data);
      runFA2Layout(graph, 150); // FA2 on just 3 nodes (almost free)
    } else if (level === "macroTopics" && selectedMacroAreaId) {
      buildMacroTopicsGraph(graph, data, selectedMacroAreaId);
      runFA2Layout(graph, 250); // FA2 on macroTopics only
    } else if (level === "topicQna" && selectedTopicId) {
      const [macroAreaName, macroTopicName] = selectedTopicId.split("::");
      if (macroAreaName && macroTopicName) {
        buildTopicQnaGraph(graph, data, macroAreaName, macroTopicName);
        runFA2Layout(graph, 300); // FA2 on macro topic + its QnA
      }
    }

    renderer.refresh();
  }, [level, selectedMacroAreaId, selectedTopicId, data]);

  // simple breadcrumbs / back buttons
  const goBackToMacroAreas = () => {
    setLevel("macroAreas");
    setSelectedMacroAreaId(null);
    setSelectedTopicId(null);
  };

  const goBackToMacroTopics = () => {
    setLevel("macroTopics");
    setSelectedTopicId(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10,
          display: "flex",
          gap: 8,
        }}
      >
        {level !== "macroAreas" && (
          <button onClick={goBackToMacroAreas}>⬅ Macro areas</button>
        )}
        {level === "topicQna" && (
          <button onClick={goBackToMacroTopics}>⬅ Macro topics</button>
        )}
      </div>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
