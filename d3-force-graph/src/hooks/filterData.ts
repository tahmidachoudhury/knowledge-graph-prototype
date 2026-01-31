// Filter nodes and links based on selected macroarea

import { ESG_MACROAREAS, ESGMacroArea } from "@/lib/constants";
import { BaseGraphNode, GraphLink, GraphNode } from "@/lib/types/graph.types";


export const filterData = (macroArea: ESGMacroArea, data: any) => {
  if (!macroArea) {
    // Initial view: show only ESG macroarea nodes
    const macroAreaNodes = data.nodes.filter(
      (node: GraphNode) =>
        node.group === "MacroArea" && ESG_MACROAREAS.includes(node.label as ESGMacroArea)
    );
    // No links at top level
    return { nodes: macroAreaNodes, links: [] };
  } else {
    // Drill-down: show all nodes belonging to this macroarea, EXCEPT the MacroArea node itself
    const nodeIds = new Set();
    const filteredNodes: GraphNode[] = [];

    // Find all nodes that belong to this macroarea (excluding MacroArea nodes)
    data.nodes.forEach((node: GraphNode) => {
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
    const filteredLinks = data.links.filter((link: GraphLink) => {
      const sourceId =
        typeof link.source === "object" ? link.source : "";
      const targetId =
        typeof link.target === "object" ? link.target : "";

      // Only include links where both source and target are in our filtered set
      // and neither is a MacroArea node
      const sourceNode = data.nodes.find((n: BaseGraphNode) => n.id === sourceId);
      const targetNode = data.nodes.find((n: BaseGraphNode) => n.id === targetId);

      return (
        nodeIds.has(sourceId) &&
        nodeIds.has(targetId) &&
        sourceNode?.group !== "MacroArea" &&
        targetNode?.group !== "MacroArea"
      );
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }
};
