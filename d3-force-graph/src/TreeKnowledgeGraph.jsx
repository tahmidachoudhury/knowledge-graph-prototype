import React, { useEffect, useRef, useState, useCallback } from "react";
// import data from "../data/tree_output.json";
import data from "../data/tq_db_nodes_and_links.json";
// import data from "../data/miserables.json";
// import data from "../data/graph.json";
import * as d3 from "d3";
import getNodeColor from "../utilities/d3js/getNodeColor";
import pentagonPath from "../utilities/d3js/pentagon";
import { useTheme } from "./ThemeContext";

// ESG macroareas to show initially
const ESG_MACROAREAS = ["Environment", "Social", "Governance"];

export default function D3KnowledgeGraph() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [selectedMacroArea, setSelectedMacroArea] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme, toggleTheme } = useTheme();

  // Filter nodes and links based on selected macroarea
  const filterData = useCallback((macroArea) => {
    if (!macroArea) {
      // Initial view: show only ESG macroarea nodes
      const macroAreaNodes = data.nodes.filter(
        (node) =>
          node.group === "MacroArea" && ESG_MACROAREAS.includes(node.label)
      );
      // No links at top level
      return { nodes: macroAreaNodes, links: [] };
    } else {
      // Drill-down: show all nodes belonging to this macroarea, EXCEPT the MacroArea node itself
      const nodeIds = new Set();
      const filteredNodes = [];

      // Find all nodes that belong to this macroarea (excluding MacroArea nodes)
      data.nodes.forEach((node) => {
        // Only include nodes that belong to this macroarea AND are not MacroArea type
        if (
          node.macroArea === macroArea &&
          node.group !== "MacroArea" &&
          !nodeIds.has(node.id)
        ) {
          filteredNodes.push(node);
          nodeIds.add(node.id);
        }
      });

      // Find all links between the filtered nodes (excluding links to/from MacroArea nodes)
      const filteredLinks = data.links.filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        // Only include links where both source and target are in our filtered set
        // and neither is a MacroArea node
        const sourceNode = data.nodes.find((n) => n.id === sourceId);
        const targetNode = data.nodes.find((n) => n.id === targetId);

        return (
          nodeIds.has(sourceId) &&
          nodeIds.has(targetId) &&
          sourceNode?.group !== "MacroArea" &&
          targetNode?.group !== "MacroArea"
        );
      });

      return { nodes: filteredNodes, links: filteredLinks };
    }
  }, []);

  const renderGraph = useCallback(
    (macroArea) => {
      if (!containerRef.current) return;

      // Clear previous render
      containerRef.current.innerHTML = "";
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      // Filter data based on selected macroarea
      const { nodes: filteredNodes, links: filteredLinks } =
        filterData(macroArea);

      if (filteredNodes.length === 0) return;

      // Drag function
      function drag(simulation) {
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

      // Specify the chart's dimensions.
      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;

      // Create nodes and links copies for simulation
      const nodes = filteredNodes.map((d) => ({ ...d }));

      // Create a map for quick node lookup
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Process links to ensure source/target reference node IDs
      const links = filteredLinks
        .map((d) => {
          const sourceId =
            typeof d.source === "object" ? d.source.id : d.source;
          const targetId =
            typeof d.target === "object" ? d.target.id : d.target;

          // Ensure both nodes exist in our filtered set
          if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
            return {
              ...d,
              source: sourceId,
              target: targetId,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Determine node radius based on level (needed for collision detection)
      const getNodeRadius = (d) => {
        // macro area will be three large bubbles
        if (d.group === "MacroArea") return 100;
        if (d.group === "Macrotopic") return 10;
        if (d.group === "Topic") return 25;
        if (d.group === "Subtopic") return 15;
        return 5;
      };

      // Create force simulation
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(macroArea ? 80 : 200) // Increased spacing for larger nodes
            .strength(0.5) // more link strength = more tight the groups are packed
        )
        .force("charge", d3.forceManyBody().strength(macroArea ? -150 : -350)) // Increased repulsion
        .force("x", d3.forceX(0))
        .force("y", d3.forceY(0))
        .force(
          "collision",
          d3.forceCollide().radius((d) => {
            // Dynamic collision radius based on node size
            const radius = getNodeRadius(d);
            return radius + 5; // Add padding around nodes
          })
        );

      simulationRef.current = simulation;

      // Create the container SVG.
      const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; display: block;");

      svgRef.current = svg;

      // Create a group container for zoom/pan transformations
      const container = svg.append("g");

      // Append links.
      const link = container
        .append("g")
        // .attr("stroke", "#999") //remove these strokes to remove the link lines
        // .attr("stroke-opacity", 0.6)
        // .attr("stroke-width", 1.5)
        .selectAll("line")
        .data(links)
        .join("line");

      // Append nodes.
      const node = container
        .append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));

      // Set up zoom behavior
      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        });

      // Add shapes conditionally: circles for Topics, pentagons for Subtopics
      node.each(function (d) {
        const nodeElement = d3.select(this);
        const color = getNodeColor(d);
        const radius = getNodeRadius(d);

        if (d.group === "Topic") {
          // Topics: circles
          nodeElement
            .append("circle")
            .attr("fill", color)
            .attr("r", radius)
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);
        } else if (d.group === "Subtopic") {
          // Subtopics: pentagons
          nodeElement
            .append("path")
            .attr("fill", color)
            .attr("d", pentagonPath(radius))
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);
        } else {
          // Other node types: default to circle for now
          nodeElement
            .append("circle")
            .attr("fill", color)
            .attr("r", radius)
            .attr("cursor", "pointer")
            .attr("stroke-width", 1.5)
            .attr("stroke", color);
        }
      });

      // Add event handlers to the node group
      node
        .on("mouseover", (event, d) => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
          setHoveredNode(d.label);
        })
        .on("mousemove", (event) => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mouseout", () => {
          setHoveredNode(null);
        })
        .on("click", (event, d) => {
          // Handle click on MacroArea node to drill down
          if (d.group === "MacroArea" && !macroArea) {
            setSelectedMacroArea(d.label);
          }
        });

      svg.call(zoom);

      simulation.on("tick", () => {
        // After forceLink processing, source/target are node objects
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

      // Stop simulation after a while
      setTimeout(() => simulation.stop(), macroArea ? 15000 : 8000);

      // Mount the generated SVG into the React container
      containerRef.current.appendChild(svg.node());
    },
    [filterData]
  );

  // Re-render when selection changes
  useEffect(() => {
    renderGraph(selectedMacroArea);
  }, [selectedMacroArea, renderGraph]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
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
          ← Back to MacroArea Overview
        </button>
      )}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px 20px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: theme === "light" ? "#fff" : "#1a1a1a",
          color: theme === "light" ? "#333" : "#fff",
          border: `2px solid ${theme === "light" ? "#333" : "#fff"}`,
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
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
