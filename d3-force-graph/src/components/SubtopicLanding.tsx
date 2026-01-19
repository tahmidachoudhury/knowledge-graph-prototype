// components/SubtopicLanding.tsx

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchSubtopicQnas } from "../lib/graphData";
import type { SubtopicQnaData, QnaNode } from "../lib/types/graph.types";
import { useNavigate } from "react-router-dom"

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
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    // QnA nodes
    const nodes = g
      .selectAll(".qna-node")
      .data(data.nodes)
      .join("g")
      .attr("class", "qna-node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onQnaClick(d);
      })
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (d) => d.question)
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onQnaClick(d);
        }
      });

    nodes
      .append("circle")
      .attr("r", 20)
      .attr("fill", "#4FD1C5")

    // Optional: difficulty indicator
    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", 12)
      .attr("fill", "white")
    // .text((d) => d.metadata.difficulty?.[0].toUpperCase() || "?");

    // Center subtopic node
    const centerNode = g
      .append("g")
      .attr("class", "center-node")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    centerNode
      .append("circle")
      .attr("r", 60)
      .attr("fill", "#2C7A7B")

    centerNode
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("fill", "white")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .text(data.centerNode.name)
      .call(wrap, 100); // Text wrapping helper

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
    const announcement = `Loaded ${data.nodes.length} questions for ${data.centerNode.name}`;
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
        aria-label={`Questions about ${data?.centerNode.name}`}
        role="img"
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      />
      <div style={{ position: "fixed", bottom: 10, }} className="sr-only" role="status" aria-live="polite">
        Graph ready for interaction. Use Tab to navigate questions, Enter to
        select.
      </div>

      <button
        onClick={() => navigate("/")}
        // className="fixed left-4 top-4 z-50 rounded bg-black px-4 py-2 text-sm font-semibold shadow"
        style={{
          position: "fixed",
          left: 4,
          top: 4,
        }}
      >
        ← Back
      </button>
    </>
  );
}

// Text wrapping helper for center node label
function wrap(text: any, width: number) {
  text.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const y = text.attr("y") || 0;
    const dy = parseFloat(text.attr("dy")) || 0;
    let tspan = text
      .text(null)
      .append("tspan")
      .attr("x", 0)
      .attr("y", y)
      .attr("dy", dy + "em");

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if ((tspan.node() as any).getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}
