import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";

const scatterLayer = new ScatterplotLayer({
  id: "nodes",
  data: nodes,
  getPosition: (d) => [d.x, d.y],
  getFillColor: [80, 150, 255],
  getRadius: 5,
  pickable: true,
});

const lineLayer = new LineLayer({
  id: "edges",
  data: links,
  getSourcePosition: (d) => [d.source.x, d.source.y],
  getTargetPosition: (d) => [d.target.x, d.target.y],
  getColor: [200, 200, 200],
  getWidth: 1,
});

export default function GraphView() {
  return (
    <DeckGL
      initialViewState={{ zoom: 0, target: [0, 0, 0] }}
      controller={true}
      layers={[lineLayer, scatterLayer]}
    />
  );
}
