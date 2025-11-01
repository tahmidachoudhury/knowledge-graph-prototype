import React from "react";
import ReactDOM from "react-dom/client";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { OrthographicView, COORDINATE_SYSTEM } from "@deck.gl/core";
import graphData from "../data/graph.json";
import computeForceLayout from "../utilities/d3ForceNodes";

export default function GraphView() {
  // Compute force-directed layout once at startup
  const { nodes, links } = computeForceLayout(graphData, {
    width: 800,
    height: 600,
    distance: 50,
    charge: -30,
    iterations: 300,
  });

  // Create Deck.GL layers
  const scatterLayer = new ScatterplotLayer({
    id: "nodes",
    data: nodes,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: (d) => [d.x, d.y],
    getFillColor: [80, 150, 255],
    getRadius: 5,
    pickable: true,
    onHover: (info) => {
      if (info.object) {
        console.log("Hovered node:", info.object.id);
      }
    },
  });

  const lineLayer = new LineLayer({
    id: "edges",
    data: links,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getSourcePosition: (d) => [d.source.x, d.source.y],
    getTargetPosition: (d) => [d.target.x, d.target.y],
    getColor: [200, 200, 200],
    getWidth: 1,
  });

  return (
    <DeckGL
      views={[new OrthographicView()]}
      initialViewState={{
        target: [400, 300, 0],
        zoom: 0,
        minZoom: -2,
        maxZoom: 5,
      }}
      controller={true}
      layers={[lineLayer, scatterLayer]}
    />
  );
}
