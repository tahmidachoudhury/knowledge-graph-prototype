import categoryPalette from "./categoryPalette";
import { Node } from "./types";

export default function getNodeColor(node: Node) {
  // Type assertion needed because TypeScript can't infer the nested structure
  const palette = categoryPalette as Record<
    string,
    Record<string, Record<string, string>>
  >;
  const macroArea = node.macroArea;
  const macrotopic = node.macrotopic;
  const group = node.group;
  const label = node.label;

  // Handle MacroArea nodes - they don't have a macrotopic
  if (group === "MacroArea") {
    // For MacroArea nodes, we could use a default color or find the first macrotopic color
    // For now, return a neutral color
    return "#cccccc";
  }

  if (!macroArea) {
    return "#999999";
  }

  // For Macrotopic nodes, use the label as the macrotopic name key
  // For Topic/Subtopic nodes, use the macrotopic field
  const macrotopicName = group === "Macrotopic" ? label : macrotopic;

  if (!macrotopicName) {
    return "#999999";
  }

  // Handle case-insensitive matching for macrotopic names
  const macroAreaPalette = palette[macroArea];
  if (!macroAreaPalette) {
    return "#999999";
  }

  // Find matching macrotopic (case-insensitive)
  const macrotopicKey = Object.keys(macroAreaPalette).find(
    (key) => key.toLowerCase() === macrotopicName.toLowerCase()
  );

  if (!macrotopicKey) {
    return "#999999";
  }

  // Now the palette keys match the group values: "Macrotopic", "Topic", "Subtopic"
  return macroAreaPalette[macrotopicKey]?.[group] || "#999999";
}
