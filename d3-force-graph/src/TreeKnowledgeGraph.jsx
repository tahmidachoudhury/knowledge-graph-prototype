import React, { useEffect, useRef } from "react";
// import data from "../data/tree_output.json";
import data from "../data/tq_db_nodes_and_links.json";
// import data from "../data/miserables.json";
// import data from "../data/graph.json";
import * as d3 from "d3";

export default function D3KnowledgeGraph() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous render (if any) for hot-reloads
    containerRef.current.innerHTML = "";

    // gimmicky drag function
    // function drag(simulation) {
    //   function dragstarted(event, d) {
    //     if (!event.active) simulation.alphaTarget(0.3).restart();
    //     d.fx = d.x;
    //     d.fy = d.y;
    //   }

    //   function dragged(event, d) {
    //     d.fx = event.x;
    //     d.fy = event.y;
    //   }

    //   function dragended(event, d) {
    //     if (!event.active) simulation.alphaTarget(0);
    //     d.fx = null;
    //     d.fy = null;
    //   }

    //   return d3
    //     .drag()
    //     .on("start", dragstarted)
    //     .on("drag", dragged)
    //     .on("end", dragended);
    // }

    const color = d3.scaleOrdinal(d3.schemePastel1);

    // Specify the chart's dimensions.
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // Compute the graph and start the force simulation.
    // data is an array at the top level; wrap it with a virtual root.
    // const root = d3.hierarchy({ name: "root", children: data });
    // const links = root.links();
    // const nodes = root.descendants();

    const links = data.links.map((d) => ({ ...d }));
    const nodes = data.nodes.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(30)
          .strength(0.7)
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .force("x", d3.forceX(0))
      .force("y", d3.forceY(0));

    // Create the container SVG.
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; display: block;");

    // Create a group container for zoom/pan transformations
    const container = svg.append("g");

    // Set up zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 8]) // min/max zoom
      .on("zoom", (event) => {
        container.attr("transform", event.transform); // pan & zoom
      });

    svg.call(zoom);

    // Append links.
    const link = container
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line");

    // Append nodes.
    const t0 = performance.now();
    const node = container
      .append("g")
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("fill", (d) => color(d))

      .attr("r", 5)
      .on("mousedown", (event, d) => {
        // Log useful details for debugging/inspection
        console.log("node data", d);
        // console.log("node.data", d?.group);
      });
    // activate drag feature here
    // .call(drag(simulation));
    const t1 = performance.now();
    console.log("Time to build nodes ms:", t1 - t0);

    node.append("title").text((d) => d.name);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    setTimeout(() => simulation.stop(), 10000);

    // Mount the generated SVG into the React container
    containerRef.current.appendChild(svg.node());

    // Cleanup on unmount
    return () => {
      simulation.stop();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
