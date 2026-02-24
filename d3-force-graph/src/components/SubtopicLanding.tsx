// components/SubtopicLanding.tsx

// TODO (Accessibility):
// x Add roving tabindex + arrow key navigation in list
// x Add label visibility toggle
// x Add arrow-key navigation between graph nodes
// x Check nodes for aria-label
//? - Contrast must be WCAG compliant
//? - Refactor + compartmentalise (DRY)


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
import { KnowledgeMapBreadcrumb } from "./Breadcrumb";
import { GraphSidebar } from "./Sidebar";
import { GraphControls } from "./GraphControls";

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
  const [showLabels, setShowLabels] = useState(false)
  const [showListView, setShowListView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);


  // This hovered node triggers the label
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
        console.log(qnaData)
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

  // Respect system-level reduced motion preference on mount (optional)
  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
    }
  }, [reducedMotion]);

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
      .attr("data-qna-id", (d) => d.id)
      .attr("role", "button")
      .attr("tabindex", 0)
      .on("mouseover", (event: any, d: any) => {
        setMousePosition({
          x: event.clientX,
          y: event.clientY,
        });
        setHoveredNode(d.question);
      })
      .on("mouseout", () => setHoveredNode(null))
      .on("focus", (event: any, d: any) => {
        // Get the node's position on screen for tooltip placement
        const nodeElement = event.currentTarget;
        const bbox = nodeElement.getBoundingClientRect();
        setMousePosition({
          x: bbox.left + bbox.width / 2,
          y: bbox.top + bbox.height / 2,
        });
        setHoveredNode(d.question);
      })
      .on("blur", () => setHoveredNode(null))
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onQnaClick(d);
          setHoveredNode(null);
        }
      });

    // Center subtopic node
    // ARIA labels for subtopic node
    const centerNode = g
      .append("g")
      .attr("class", "center-node")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .attr("aria-label", `Questions for ${data.centerNode.label}`)
      .attr("role", "button")


    const centerColor = getNodeColor(data.centerNode as any);

    centerNode
      .append("circle")
      .attr("r", 100)
      .attr("fill", centerColor);

    // ARIA labels for qna node
    nodes.each(function (d: any) {
      const node = d3.select(this);

      // decide radius/type if you ever mix Subtopic + QnA here
      const radius = d.group === "Subtopic" ? 60 : 20
      const color = getNodeColor(d);

      node
        .attr("aria-label", (d: any) => d.question)
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
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    // store refs
    zoomRef.current = zoom;
    svgSelectionRef.current = svg;

    // apply zoom
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

  useEffect(() => {
    if (showLabels) {
      setHoveredNode(null);
    }
  }, [showLabels]);

  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);

  function handleZoomIn() {
    if (!zoomRef.current || !svgSelectionRef.current) return;

    if (reducedMotion) {
      svgSelectionRef.current.call(zoomRef.current.scaleBy, 1.2);
    } else {
      svgSelectionRef.current
        .transition()
        .duration(250)
        .call(zoomRef.current.scaleBy, 1.2);
    }
  }

  function handleZoomOut() {
    if (!zoomRef.current || !svgSelectionRef.current) return;

    if (reducedMotion) {
      svgSelectionRef.current.call(zoomRef.current.scaleBy, 0.8);
    } else {
      svgSelectionRef.current
        .transition()
        .duration(250)
        .call(zoomRef.current.scaleBy, 0.8);
    }
  }

  //gets the x y position of the qna node
  function getNodeScreenPosition(d: any) {
    const nodeEl = document.querySelector<SVGGElement>(
      `[data-qna-id="${d.id}"]`
    );

    if (!nodeEl) return null;

    const bbox = nodeEl.getBoundingClientRect();
    return {
      x: bbox.left + bbox.width / 2,
      y: bbox.top + bbox.height / 2,
    };
  }


  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              borderBottom: "2px solid #0d9488", // teal-600
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <p
            style={{
              marginTop: "16px",
              color: "#4b5563", // gray-600
            }}
          >
            Loading questions...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "28rem",
          }}
        >
          <p
            style={{
              color: "#dc2626", // red-600
              fontWeight: 500,
            }}
          >
            Failed to load questions
          </p>
          <p
            style={{
              marginTop: "8px",
              color: "#4b5563", // gray-600
            }}
          >
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <svg
        ref={svgRef}
        aria-label={`Questions about ${data?.centerNode.label}`}
        role="img"
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      />

      <div
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Graph ready for interaction. Use Tab to navigate questions, Enter to
        select.
      </div>

      {data?.centerNode.label && (
        <KnowledgeMapBreadcrumb
          macroArea={data?.centerNode.macroArea}
          macroTopic={data?.centerNode.macrotopic}
          topic={data?.centerNode.topic}
          subtopic={data?.centerNode.label}
          theme={theme}
        />
      )}



      {showListView && data && <GraphSidebar
        variant="qna"
        macroArea={data?.centerNode.macroArea}
        subtopic={data.centerNode.label}
        nodes={data.nodes}
        onSelectQuestion={onQnaClick}
      />
      }

      {data?.nodes.map((d) => {
        const isVisible =
          showLabels || hoveredNode === d.question;

        if (!isVisible) return null;

        {/* This tooltip will fire only if you hover over a node */ }
        return (
          <HoverTooltip
            key={d.id}
            text={d.question}
            position={getNodeScreenPosition(d)}
            theme={theme}
          />
        );
      })}

      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((prev) => !prev)}
        showListView={showListView}
        onToggleListView={() => setShowListView((prev) => !prev)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((prev) => !prev)}
        setTheme={theme}
        onToggleTheme={toggleTheme}
      />

      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          padding: "10px 20px",
          fontSize: "16px",
          color: theme === "light" ? "#333" : "#fff",
          border: `2px solid ${theme === "light" ? "#333" : "#fff"}`,
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.5)" : "rgba(15, 15, 15, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", // Safari
        }}
      >
        ← Back to Main Graph
      </button>
    </>
  );
}


