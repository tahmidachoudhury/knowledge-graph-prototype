import fs from "fs";

// Load your raw dataset
const data = JSON.parse(fs.readFileSync("qna_enriched.json", "utf8"));

// Helper to find or create a child node by name
function findOrCreateChild(children, name) {
  let child = children.find((c) => c.name === name);
  if (!child) {
    child = { name, children: [] };
    children.push(child);
  }
  return child;
}

// Build the hierarchical structure
const rootMap = new Map();

for (const entry of data) {
  const macro = entry.Macrotopic?.trim() || "Unknown Macrotopic";
  const topic = entry.Topic?.trim() || "Unknown Topic";
  const sub = entry.Subtopic?.trim() || "Unknown Subtopic";
  const qnaId = entry.id || entry.qna_id;

  // Get or create macrotopic level
  if (!rootMap.has(macro)) {
    rootMap.set(macro, { name: macro, children: [] });
  }
  const macroNode = rootMap.get(macro);

  // Get or create topic level
  const topicNode = findOrCreateChild(macroNode.children, topic);

  // Get or create subtopic level
  const subNode = findOrCreateChild(topicNode.children, sub);

  // Add QnA node
  subNode.children.push({ name: qnaId });
}

// Convert map to array or single root (depending on your dataset)
const output = Array.from(rootMap.values());

// Save the result
fs.writeFileSync("tree_output.json", JSON.stringify(output, null, 2));
console.log("✅ Hierarchical tree created → tree_output.json");
