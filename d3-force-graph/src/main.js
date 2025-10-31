import React from "react";
import ReactDOM from "react-dom/client";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import graphData from "../data/graph.json";

// Destructure node/link data
const { nodes, links } = graphData;

// Create Deck.GL layers
const scatterLayer = new ScatterplotLayer({
  id: "nodes",
  data: nodes,
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
  getSourcePosition: (d) => [d.source.x, d.source.y],
  getTargetPosition: (d) => [d.target.x, d.target.y],
  getColor: [200, 200, 200],
  getWidth: 1,
});

function GraphView() {
  return (
    <DeckGL
      initialViewState={{
        target: [0, 0, 0],
        zoom: 0,
        minZoom: -2,
        maxZoom: 5,
      }}
      controller={true}
      layers={[lineLayer, scatterLayer]}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<GraphView />);
