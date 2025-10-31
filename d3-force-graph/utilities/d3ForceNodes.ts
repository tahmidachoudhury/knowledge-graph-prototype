import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
} from "d3-force";
import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";
import graphData from "../data/graph.json";

interface GraphNode extends SimulationNodeDatum {
  id: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export type ComputeOptions = {
  width?: number;
  height?: number;
  distance?: number;
  charge?: number;
  iterations?: number;
};

export function computeForceLayout(
  data: GraphData = graphData as GraphData,
  options: ComputeOptions = {}
): GraphData {
  const {
    width = 800,
    height = 600,
    distance = 50,
    charge = -30,
    iterations = 300,
  } = options;

  const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }));
  const links: GraphLink[] = data.links.map((l) => ({ ...l }));

  const simulation = forceSimulation<GraphNode>(nodes)
    .force(
      "link",
      forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(distance)
    )
    .force("charge", forceManyBody().strength(charge))
    .force("center", forceCenter(width / 2, height / 2))
    .stop();

  for (let i = 0; i < iterations; ++i) simulation.tick();

  console.log(nodes[0]);

  return { nodes, links };
}

export default computeForceLayout;
