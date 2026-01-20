// components/SubtopicLanding.tsx

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchSubtopicQnas } from "../lib/graphData";
import type { SubtopicQnaData, QnaNode } from "../lib/types/graph.types";
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/lib/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import { ShowLinksToggle } from "./ShowLinksToggle";
import { HoverTooltip } from "./HoverTooltip";
import { addWrappedLabelWithBackground } from "@/lib/d3js/nodeLabels";
import getNodeColor from "@/lib/d3js/getNodeColor";

interface Props {
  subtopicId: string;
  onQnaClick: (qna: QnaNode) => void;
}

export function SubtopicLanding({ subtopicId, onQnaClick }: Props) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<SubtopicQnaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });


  useEffect(() => {
    const abortController = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const qnaData = await fetchSubtopicQnas(
          subtopicId,
          abortController.signal
        );

        setData(qnaData);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as any).name === "AbortError"
        )
          return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      abortController.abort();
    };
  }, [subtopicId]);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Clear previous
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Radial force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force("radial", d3.forceRadial(300, centerX, centerY).strength(0.8))
      .force("collide", d3.forceCollide(30))
      .force("charge", d3.forceManyBody().strength(-50))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    // Links (if any relationships)
    const links = g
      .selectAll(".link")
      .data(data.links || [])
      .join("line")
      .attr("class", "link")
      .attr("stroke", "#CBD5E0")
      .attr("stroke-opacity", showLinks ? 0.6 : 0)
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // QnA nodes
    const nodes = g
      .selectAll<SVGGElement, any>(".qna-node")
      .data(data.nodes)
      .join("g")
      .attr("class", "qna-node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onQnaClick(d);
        setHoveredNode(null);
      })
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (d) => d.question)
      .on("mouseover", (event: any, d: any) => {
        setMousePosition({
          x: event.clientX,
          y: event.clientY,
        });
        setHoveredNode(d.question);
      })
      .on("mouseout", () => setHoveredNode(null))
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onQnaClick(d);
          setHoveredNode(null);
        }
      });

    // Center subtopic node
    const centerNode = g
      .append("g")
      .attr("class", "center-node")
      .attr("transform", `translate(${centerX}, ${centerY})`)


    const centerColor = getNodeColor(data.centerNode as any);

    centerNode
      .append("circle")
      .attr("r", 100)
      .attr("fill", centerColor);

    nodes.each(function (d: any) {
      const node = d3.select(this);

      // decide radius/type if you ever mix Subtopic + QnA here
      const radius = d.group === "Subtopic" ? 60 : 20
      const color = getNodeColor(d);

      node
        .append("circle")
        .attr("r", radius)
        .attr("fill", color);
    });

    addWrappedLabelWithBackground(centerNode as any, {
      label: data.centerNode.label,
      maxWidth: 100, // hard-coded
    });

    // Simulation tick
    simulation.on("tick", () => {
      nodes.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);

      links
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
    });

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);



    // Announce to screen readers
    const announcement = `Loaded ${data.nodes.length} questions for ${data.centerNode.label}`;
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.className = "sr-only";
    liveRegion.textContent = announcement;
    document.body.appendChild(liveRegion);
    setTimeout(() => liveRegion.remove(), 1000);

    return () => {
      simulation.stop();
    };
  }, [data, onQnaClick]);

  //! all the tailwind css needs to GO!!!!
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium">Failed to load questions</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <svg
        ref={svgRef}
        aria-label={`Questions about ${data?.centerNode.label}`}
        role="img"
        className="w-screen h-screen overflow-hidden relative"
      />
      <div className="sr-only" role="status" aria-live="polite">
        Graph ready for interaction. Use Tab to navigate questions, Enter to
        select.
      </div>
      {/* <ShowLinksToggle
        theme={theme}
        showLinks={showLinks}
        onToggle={() => setShowLinks(v => !v)}
        style={{
          position: "absolute",
          top: "20px",
          right: "180px",
          zIndex: 1000,
        }}
      /> */}
      <ThemeToggle
        theme={theme}
        onToggle={toggleTheme}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      />

      {hoveredNode && (
        <HoverTooltip
          text={hoveredNode}
          position={hoveredNode ? mousePosition : null}
          theme={theme}
        />
      )}


      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: theme === "light" ? "#fff" : "#1a1a1a",
          color: theme === "light" ? "#333" : "#fff",
          border: `2px solid ${theme === "light" ? "#333" : "#fff"}`,
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        ← Back to Main Graph
      </button>
    </>
  );
}


