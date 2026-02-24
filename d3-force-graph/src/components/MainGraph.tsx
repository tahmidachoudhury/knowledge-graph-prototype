// src/components/MainGraph.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import data from "../../data/main_graph.json"; // adjust path if needed
import { ESG_MACROAREAS, ESGMacroArea } from "@/lib/constants";

import getNodeColor from "@/lib/d3js/getNodeColor";
import pentagonPath from "@/lib/d3js/pentagon";

import { useTheme } from "@/lib/ThemeContext";

import type { GraphNode, GraphLink, D3Node, BaseGraphNode, MacroTopicItem, MacrotopicNode, TopicNode, SubtopicNode, TopicItem } from "../lib/types/graph.types";
import { HoverTooltip } from "./overlays/HoverTooltip";
import { addWrappedLabelWithBackground } from "@/lib/d3js/nodeLabels";
import { KnowledgeMapBreadcrumb } from "./overlays/Breadcrumb";
import { GraphSidebar } from "./overlays/Sidebar";
import { GraphControls } from "./overlays/GraphControls";
import { generateFakeMacrotopicNodes } from "@/lib/generateFakeMacrotopicNodes";

type MainData = { nodes: GraphNode[]; links: GraphLink[] };

interface Props {
  onSubtopicClick: (subtopicId: string) => void;
}

export default function MainGraph({ onSubtopicClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
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
  const [showListView, setShowListView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Number of extra synthetic macrotopic clusters (0 = DB default only)
  const [clusterFactor, setClusterFactor] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const typed = data as unknown as MainData;


  const filterData = useCallback(
    (macroArea: ESGMacroArea | null) => {
      if (!macroArea) {
        const macroAreaNodes = typed.nodes.filter(
          (n) =>
            n.group === "MacroArea" &&
            ESG_MACROAREAS.includes(n.label as ESGMacroArea)
        );

        // Overview only shows macro areas; cluster factor is effectively a no-op here.
        return { nodes: [...macroAreaNodes], links: [] };
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

      const baseNodeIds = new Set(filteredNodes.map((n) => n.id));

      const filteredLinks = typed.links.filter((l) => {
        const s =
          typeof l.source === "object" ? (l.source as any).id : l.source;
        const t =
          typeof l.target === "object" ? (l.target as any).id : l.target;

        if (!baseNodeIds.has(s) || !baseNodeIds.has(t)) return false;

        const sn = typed.nodes.find((n) => n.id === s);
        const tn = typed.nodes.find((n) => n.id === t);

        return sn?.group !== "MacroArea" && tn?.group !== "MacroArea";
      });

      if (clusterFactor > 0) {
        const { nodes, links } = generateFakeMacrotopicNodes(
          filteredNodes,
          filteredLinks,
          clusterFactor
        );
        return { nodes, links };
      }

      return { nodes: [...filteredNodes], links: filteredLinks };
    },
    [typed.nodes, typed.links, clusterFactor]
  );

  const renderGraph = useCallback(
    (macroArea: string | null) => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";
      simulationRef.current?.stop();

      const { nodes: filteredNodes, links: filteredLinks } =
        filterData(macroArea as ESGMacroArea);
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
        // When reduced motion is enabled, avoid re-heating the simulation
        // and keep drag purely positional.
        function dragstarted(event: any, d: any) {
          if (!reducedMotion && !event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        function dragged(event: any, d: any) {
          d.fx = event.x;
          d.fy = event.y;
        }
        function dragended(event: any, d: any) {
          if (!reducedMotion && !event.active) sim.alphaTarget(0);
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

      // store refs
      zoomRef.current = zoom;

      // apply zoom
      svg.call(zoom as any);

      // Shapes
      node.each(function (d: GraphNode) {
        const nodeElement = d3.select(this);
        const color = getNodeColor(d as any);
        const radius = getNodeRadius(d);

        //ARIA labels for all nodes
        nodeElement.attr("aria-label", `${d.group}: ${d.label}`)

        if (d.group === "MacroArea") {
          const label = d.label || d.id || ""
          const maxWidth = radius
          nodeElement.append("circle").attr("fill", color).attr("r", radius);
          addWrappedLabelWithBackground(nodeElement, {
            label,
            maxWidth,
          })
        } else if (d.group === "Macrotopic") {
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
          addWrappedLabelWithBackground(nodeElement, {
            label,
            maxWidth,
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



      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      const baseDuration = macroArea ? 15000 : 8000;
      const duration = reducedMotion ? baseDuration / 2 : baseDuration;
      setTimeout(() => simulation.stop(), duration);

      containerRef.current.appendChild(svg.node()!);
    },
    [filterData, showLinks, onSubtopicClick, reducedMotion]
  );

  useEffect(() => {
    renderGraph(selectedMacroArea);
  }, [selectedMacroArea, renderGraph]);

  // Respect system-level reduced motion preference on mount (optional, but helpful)
  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (svgRef.current) {
      const linkGroup = (svgRef.current as any).select(".link-group");
      if (linkGroup.node())
        linkGroup.attr("stroke-opacity", showLinks ? 0.6 : 0);
    }
  }, [showLinks]);

  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  function buildSidebarHierarchy(nodes: GraphNode[]): MacroTopicItem[] {
    const macrotopics = nodes.filter(
      (n): n is MacrotopicNode => n.group === "Macrotopic",
    );
    const topics = nodes.filter(
      (n): n is TopicNode => n.group === "Topic",
    );
    const subtopics = nodes.filter(
      (n): n is SubtopicNode => n.group === "Subtopic",
    );

    return macrotopics.map((mt) => {
      const topicsForMacrotopic = topics.filter(
        (t) => t.macrotopic === mt.label || t.macrotopic === mt.id,
      );

      const topicItems: TopicItem[] = topicsForMacrotopic.map((topic) => {
        const subtopicsForTopic = subtopics.filter(
          (s) => s.topic === topic.label || s.topic === topic.id,
        );

        return {
          topic,
          subtopics: subtopicsForTopic,
        };
      });

      return {
        macrotopic: mt,
        topics: topicItems,
      };
    });
  }

  function handleZoomIn() {
    if (!zoomRef.current || !svgRef.current) return;

    if (reducedMotion) {
      svgRef.current.call(zoomRef.current.scaleBy, 1.2);
    } else {
      svgRef.current
        .transition()
        .duration(250)
        .call(zoomRef.current.scaleBy, 1.2);
    }
  }

  function handleZoomOut() {
    if (!zoomRef.current || !svgRef.current) return;

    if (reducedMotion) {
      svgRef.current.call(zoomRef.current.scaleBy, 0.8);
    } else {
      svgRef.current
        .transition()
        .duration(250)
        .call(zoomRef.current.scaleBy, 0.8);
    }
  }

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


      {selectedMacroArea && (
        <KnowledgeMapBreadcrumb
          macroArea={selectedMacroArea}
          theme={theme}
        />
      )}

      {hoveredNode && (
        <HoverTooltip
          text={hoveredNode}
          position={hoveredNode ? mousePosition : null}
          theme={theme}
        />
      )}

      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        clusterFactor={clusterFactor}
        onClusterFactorChange={setClusterFactor}
        showListView={showListView}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((prev) => !prev)}
        onToggleListView={() => setShowListView((prev) => !prev)}
        setTheme={theme}
        onToggleTheme={toggleTheme}
        showLinks={showLinks}
        onToggleLinks={() => setShowLinks(v => !v)}
      />

      {selectedMacroArea && showListView && <GraphSidebar
        variant="hierarchy"
        macroArea={selectedMacroArea}
        macrotopics={buildSidebarHierarchy(filterData(selectedMacroArea as ESGMacroArea).nodes)}
        onSelectSubtopic={(sub) => onSubtopicClick(sub)}
      />
      }


      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
