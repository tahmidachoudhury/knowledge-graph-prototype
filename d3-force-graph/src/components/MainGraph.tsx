// src/components/MainGraph.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import data from "../../data/main_graph.json"; // adjust path if needed
import { ESG_MACROAREAS } from "@/lib/constants";

import getNodeColor from "@/lib/d3js/getNodeColor";
import pentagonPath from "@/lib/d3js/pentagon";

import { useTheme } from "@/lib/ThemeContext";

import type { GraphNode, GraphLink, D3Node } from "../lib/types/graph.types";
import { ShowLinksToggle } from "./ShowLinksToggle";
import { ThemeToggle } from "./ThemeToggle";

type MainData = { nodes: GraphNode[]; links: GraphLink[] };

interface Props {
  onSubtopicClick: (subtopicId: string) => void;
}

export default function MainGraph({ onSubtopicClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, undefined> | null>(null);

  const [selectedMacroArea, setSelectedMacroArea] = useState<string | null>(
    null
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLinks, setShowLinks] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const typed = data as unknown as MainData;

  const filterData = useCallback(
    (macroArea: string | null) => {
      if (!macroArea) {
        const macroAreaNodes = typed.nodes.filter(
          (n) => n.group === "MacroArea" && ESG_MACROAREAS.includes(n.label)
        );
        return { nodes: macroAreaNodes, links: [] as GraphLink[] };
      }

      const nodeIds = new Set<string>();
      const filteredNodes: GraphNode[] = [];

      typed.nodes.forEach((n) => {
        if (
          n.macroArea === macroArea &&
          n.group !== "MacroArea" &&
          !nodeIds.has(n.id)
        ) {
          filteredNodes.push(n);
          nodeIds.add(n.id);
        }
      });

      const filteredLinks = typed.links.filter((l) => {
        const s =
          typeof l.source === "object" ? (l.source as any).id : l.source;
        const t =
          typeof l.target === "object" ? (l.target as any).id : l.target;

        if (!nodeIds.has(s) || !nodeIds.has(t)) return false;

        const sn = typed.nodes.find((n) => n.id === s);
        const tn = typed.nodes.find((n) => n.id === t);

        return sn?.group !== "MacroArea" && tn?.group !== "MacroArea";
      });

      return { nodes: filteredNodes, links: filteredLinks };
    },
    [typed.nodes, typed.links]
  );

  const renderGraph = useCallback(
    (macroArea: string | null) => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";
      simulationRef.current?.stop();

      const { nodes: filteredNodes, links: filteredLinks } =
        filterData(macroArea);
      if (filteredNodes.length === 0) return;

      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;

      const nodes: D3Node[] = filteredNodes.map((d) => ({ ...d }));
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      const links = filteredLinks
        .map((d) => {
          const sourceId =
            typeof d.source === "object" ? (d.source as any).id : d.source;
          const targetId =
            typeof d.target === "object" ? (d.target as any).id : d.target;
          if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
            return { ...d, source: sourceId, target: targetId };
          }
          return null;
        })
        .filter(Boolean) as any[];

      const getNodeRadius = (d: GraphNode) => {
        if (d.group === "MacroArea") return 100;
        if (d.group === "Macrotopic") return 60;
        if (d.group === "Topic") return 25;
        if (d.group === "Subtopic") return 15;
        return 8;
      };

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(macroArea ? 80 : 200)
            .strength(0.5)
        )
        .force("charge", d3.forceManyBody().strength(macroArea ? -150 : -350))
        .force("x", d3.forceX(0))
        .force("y", d3.forceY(0))
        .force(
          "collision",
          d3.forceCollide().radius((d: any) => getNodeRadius(d) + 5)
        );

      simulationRef.current = simulation;

      const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; display: block;");

      svgRef.current = svg as any;

      const container = svg.append("g");

      const link = container
        .append("g")
        .attr("class", "link-group")
        .attr("stroke", "#999")
        .attr("stroke-opacity", showLinks ? 0.6 : 0)
        .attr("stroke-width", 1.5)
        .selectAll("line")
        .data(links)
        .join("line");

      const drag = (sim: d3.Simulation<D3Node, undefined>) => {
        function dragstarted(event: any, d: any) {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        function dragged(event: any, d: any) {
          d.fx = event.x;
          d.fy = event.y;
        }
        function dragended(event: any, d: any) {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
        return d3
          .drag<SVGGElement, D3Node>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      };

      const node = container
        .append("g")
        .selectAll<SVGGElement, D3Node>("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        });

      // Shapes
      node.each(function (d) {
        const nodeElement = d3.select(this);
        const color = getNodeColor(d as any);
        const radius = getNodeRadius(d);

        if (d.group === "Macrotopic") {
          const cardSize = 120;
          const cornerRadius = 8;
          const padding = 10;
          const maxWidth = cardSize - padding * 2;

          nodeElement
            .append("rect")
            .attr("fill", color)
            .attr("width", cardSize)
            .attr("height", cardSize)
            .attr("x", -cardSize / 2)
            .attr("y", -cardSize / 2)
            .attr("rx", cornerRadius)
            .attr("ry", cornerRadius)
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);

          const label = d.label || d.id || "";
          const words = label.split(/\s+/);
          const textElement = nodeElement
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "white")
            .attr("font-size", "13px")
            .attr("font-weight", "500")
            .attr("font-family", "sans-serif")
            .attr("pointer-events", "none")
            .attr("x", 0)
            .attr("y", 0);

          const lines: string[] = [];
          let currentLine: string[] = [];

          words.forEach((word) => {
            const testLine = currentLine.length
              ? currentLine.join(" ") + " " + word
              : word;
            const estimatedWidth = testLine.length * 7;
            if (estimatedWidth > maxWidth && currentLine.length) {
              lines.push(currentLine.join(" "));
              currentLine = [word];
            } else {
              currentLine.push(word);
            }
          });

          if (currentLine.length) lines.push(currentLine.join(" "));

          const lineHeight = 16;
          const startY = (-(lines.length - 1) * lineHeight) / 2;
          lines.forEach((line, i) => {
            textElement
              .append("tspan")
              .attr("x", 0)
              .attr("y", startY + i * lineHeight)
              .text(line);
          });
        } else if (d.group === "Topic") {
          nodeElement
            .append("circle")
            .attr("fill", color)
            .attr("r", radius)
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);
        } else if (d.group === "Subtopic") {
          nodeElement
            .append("path")
            .attr("fill", color)
            .attr("d", pentagonPath(radius))
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);
        } else {
          nodeElement.append("circle").attr("fill", color).attr("r", radius);
        }
      });

      // Events
      node
        .on("mouseover", (event: any, d: any) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setMousePosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
          setHoveredNode(d.label);
        })
        .on("mousemove", (event: any) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setMousePosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mouseout", () => setHoveredNode(null))
        .on("click", (event: any, d: any) => {
          // Drill down macro areas
          if (d.group === "MacroArea" && !macroArea) {
            setSelectedMacroArea(d.label);
            return;
          }

          // NEW: route to subtopic view
          if (d.group === "Subtopic") {
            event.stopPropagation();
            onSubtopicClick(d.id);
          }
        });

      svg.call(zoom as any);

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      setTimeout(() => simulation.stop(), macroArea ? 15000 : 8000);

      containerRef.current.appendChild(svg.node()!);
    },
    [filterData, showLinks, onSubtopicClick]
  );

  useEffect(() => {
    renderGraph(selectedMacroArea);
  }, [selectedMacroArea, renderGraph]);

  useEffect(() => {
    if (svgRef.current) {
      const linkGroup = (svgRef.current as any).select(".link-group");
      if (linkGroup.node())
        linkGroup.attr("stroke-opacity", showLinks ? 0.6 : 0);
    }
  }, [showLinks]);

  useEffect(() => {
    return () => simulationRef.current?.stop();
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {selectedMacroArea && (
        <button
          onClick={() => setSelectedMacroArea(null)}
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
          ← Back to Macro Area Overview
        </button>
      )}
      <ShowLinksToggle
        showLinks={showLinks}
        onToggle={() => setShowLinks(v => !v)}
        className="absolute top-5 right-48 z-[1000]"
      />
      <ThemeToggle
        theme={theme}
        onToggle={toggleTheme}
        className="absolute top-5 right-5 z-[1000]"
      />
      {selectedMacroArea && (
        <div
          className={theme === "light" ? "theme-light" : "theme-dark"}
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "10px 20px",
            fontSize: "18px",
            fontWeight: "bold",
            border: "2px solid",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {selectedMacroArea} - Macrotopics, Topics & Subtopics
        </div>
      )}

      {hoveredNode && (
        <div
          className={
            theme === "light"
              ? "theme-light theme-hover"
              : "theme-dark theme-hover"
          }
          style={{
            position: "absolute",
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y + 10}px`,
            zIndex: 1000,
            padding: "10px 20px",
            fontSize: "16px",
            border: "2px solid",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            pointerEvents: "none",
          }}
        >
          {hoveredNode}
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
