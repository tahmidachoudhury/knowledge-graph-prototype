import React, { useEffect, useRef, useState, useCallback } from "react";
// import data from "../data/tree_output.json";
import data from "../data/tq_db_nodes_and_links.json";
// import data from "../data/miserables.json";
// import data from "../data/graph.json";
import * as d3 from "d3";
import getNodeColor from "../utilities/d3js/getNodeColor";

// ESG macroareas to show initially
const ESG_MACROAREAS = ["Environment", "Social", "Governance"];

export default function D3KnowledgeGraph() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [selectedMacroArea, setSelectedMacroArea] = useState(null);

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
      // Drill-down: show all nodes and links belonging to this macroarea
      const nodeIds = new Set();
      const filteredNodes = [];

      // Start with the macroarea node
      const macroAreaNode = data.nodes.find(
        (node) =>
          node.group === "MacroArea" &&
          (node.label === macroArea || node.id === `MacroArea:${macroArea}`)
      );
      if (macroAreaNode) {
        filteredNodes.push(macroAreaNode);
        nodeIds.add(macroAreaNode.id);
      }

      // Find all nodes that belong to this macroarea
      data.nodes.forEach((node) => {
        if (node.macroArea === macroArea && !nodeIds.has(node.id)) {
          filteredNodes.push(node);
          nodeIds.add(node.id);
        }
      });

      // Find all links between the filtered nodes
      const filteredLinks = data.links.filter(
        (link) =>
          nodeIds.has(
            typeof link.source === "object" ? link.source.id : link.source
          ) &&
          nodeIds.has(
            typeof link.target === "object" ? link.target.id : link.target
          )
      );

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

      // Create force simulation
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(macroArea ? 30 : 150) // More spacing at top level
            .strength(0.7)
        )
        .force("charge", d3.forceManyBody().strength(macroArea ? -50 : -200))
        .force("x", d3.forceX(0))
        .force("y", d3.forceY(0))
        .force("collision", d3.forceCollide().radius(20));

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
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5)
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

      const hoverLabel = container
        .append("g")
        .attr("class", "hover-label")
        .style("pointer-events", "none")
        .style("display", "none");

      const labelPadding = 4;

      const hoverBackground = hoverLabel
        .append("rect")
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", "#fff")
        .attr("fill-opacity", 0.9)
        .attr("stroke", "#333")
        .attr("stroke-opacity", 0.6);

      const hoverText = hoverLabel
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.31em")
        .attr("fill", "#111")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.75)
        .attr("paint-order", "stroke");

      const labelOffset = { y: -20 };

      // Determine node radius based on level
      const getNodeRadius = (d) => {
        if (d.group === "MacroArea") return 15;
        if (d.group === "Macrotopic") return 10;
        if (d.group === "Topic") return 7;
        return 5;
      };

      node
        .append("circle")
        .attr("fill", (d) => getNodeColor(d))
        .attr("r", getNodeRadius)
        .attr("cursor", "pointer")
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
          hoverLabel.style("display", "block");
          hoverText.text(d.label);
          hoverLabel.attr(
            "transform",
            `translate(${d.x},${d.y + labelOffset.y})`
          );
          const textBox = hoverText.node().getBBox();
          hoverBackground
            .attr("x", textBox.x - labelPadding)
            .attr("y", textBox.y - labelPadding)
            .attr("width", textBox.width + labelPadding * 2)
            .attr("height", textBox.height + labelPadding * 2);
        })
        .on("mouseout", () => {
          hoverLabel.style("display", "none");
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
            backgroundColor: "#fff",
            border: "2px solid #333",
            borderRadius: "5px",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          ← Back to ESG Overview
        </button>
      )}
      {selectedMacroArea && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "10px 20px",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "2px solid #333",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {selectedMacroArea} - Macrotopics, Topics & Subtopics
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
