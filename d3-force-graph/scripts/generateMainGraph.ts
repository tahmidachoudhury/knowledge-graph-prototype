// scripts/generateMainGraph.ts

import fs from "fs";
import path from "path";
import type {
  RawQnaEntry,
  MacroAreaNode,
  MacrotopicNode,
  TopicNode,
  SubtopicNode,
  GraphLink,
  MainGraphData,
} from "../src/types/graph.types";

// ============================================================================
// Configuration
// ============================================================================

const RAW_DATA_PATH = "./data/qna_enriched.json";
const OUTPUT_PATH = "./data/main_graph.json";

// Defined MacroAreas
const macroareas: Record<string, string[]> = {
  Environment: [
    "Clean water and sanitation",
    "Climate action",
    "Life below water",
    "Life on land",
    "Sustainable consumption and production",
    "Clean energy",
    "Smart cities",
  ],
  Governance: [
    "Partnerships for the goals",
    "Peace, justice and strong institutions",
  ],
  Social: [
    "Reduced inequalities",
    "Industry, innovation and infrastructure",
    "Decent work and economic growth",
    "Gender equity",
    "Quality education",
    "Good health and well-being",
    "Zero hunger",
    "No poverty",
  ],
};

// ============================================================================
// Helper Types
// ============================================================================

interface NodeMaps {
  MacroArea: Map<string, MacroAreaNode>;
  Macrotopic: Map<string, MacrotopicNode>;
  Topic: Map<string, TopicNode>;
  Subtopic: Map<string, SubtopicNode>;
}

// ============================================================================
// Setup
// ============================================================================

// Build lookup table for macrotopic -> macro area
const macroAreaLookup = new Map<string, string>();
for (const [macroArea, macrotopics] of Object.entries(macroareas)) {
  macrotopics.forEach((macrotopic) => {
    macroAreaLookup.set(macrotopic.toLowerCase(), macroArea);
  });
}

const macroAreaOrder = Object.keys(macroareas);
const groupOrder = ["MacroArea", "Macrotopic", "Topic", "Subtopic"] as const;

const nodeMaps: NodeMaps = {
  MacroArea: new Map(),
  Macrotopic: new Map(),
  Topic: new Map(),
  Subtopic: new Map(),
};

const links: GraphLink[] = [];
const linkSet = new Set<string>();

// ============================================================================
// Helper Functions
// ============================================================================

function sanitize(value: string | undefined | null, fallback: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length) return trimmed;
  }
  return fallback;
}

function macroAreaIndex(name: string): number {
  const idx = macroAreaOrder.indexOf(name);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function ensureMacroAreaNode(key: string, label: string): MacroAreaNode {
  if (!nodeMaps.MacroArea.has(key)) {
    nodeMaps.MacroArea.set(key, {
      id: `MacroArea:${key}`,
      label,
      group: "MacroArea",
    });
  }
  return nodeMaps.MacroArea.get(key)!;
}

function ensureMacrotopicNode(
  key: string,
  label: string,
  macroArea: string
): MacrotopicNode {
  if (!nodeMaps.Macrotopic.has(key)) {
    nodeMaps.Macrotopic.set(key, {
      id: `Macrotopic:${key}`,
      label,
      group: "Macrotopic",
      macroArea,
    });
  }
  return nodeMaps.Macrotopic.get(key)!;
}

function ensureTopicNode(
  key: string,
  label: string,
  macroArea: string,
  macrotopic: string
): TopicNode {
  if (!nodeMaps.Topic.has(key)) {
    nodeMaps.Topic.set(key, {
      id: `Topic:${key}`,
      label,
      group: "Topic",
      macroArea,
      macrotopic,
    });
  }
  return nodeMaps.Topic.get(key)!;
}

function ensureSubtopicNode(
  key: string,
  label: string,
  macroArea: string,
  macrotopic: string,
  topic: string
): SubtopicNode {
  if (!nodeMaps.Subtopic.has(key)) {
    nodeMaps.Subtopic.set(key, {
      id: `Subtopic:${key}`,
      label,
      group: "Subtopic",
      macroArea,
      macrotopic,
      topic,
    });
  }
  return nodeMaps.Subtopic.get(key)!;
}

function ensureLink(source: string, target: string): void {
  const key = `${source}→${target}`;
  if (linkSet.has(key)) return;
  links.push({ source, target, value: 1 });
  linkSet.add(key);
}

// ============================================================================
// Main Processing
// ============================================================================

async function generateMainGraph(): Promise<void> {
  console.log("📊 Starting main graph generation...\n");

  // Read raw data
  const rawData: RawQnaEntry[] = JSON.parse(
    fs.readFileSync(RAW_DATA_PATH, "utf-8")
  );

  console.log(`✓ Loaded ${rawData.length} QnA entries`);

  // Process each entry
  for (const entry of rawData) {
    const macrotopic = sanitize(entry.Macrotopic, "Unknown Macrotopic");
    const topic = sanitize(entry.Topic, "Unknown Topic");
    const subtopic = sanitize(entry.Subtopic, "Unknown Subtopic");

    const macroArea =
      macroAreaLookup.get(macrotopic.toLowerCase()) || "Unmapped Macrotopic";

    // Create/get nodes
    const macroAreaNode = ensureMacroAreaNode(macroArea, macroArea);
    const macrotopicKey = `${macroArea}|${macrotopic}`;
    const macrotopicNode = ensureMacrotopicNode(
      macrotopicKey,
      macrotopic,
      macroArea
    );
    const topicKey = `${macrotopicKey}|${topic}`;
    const topicNode = ensureTopicNode(topicKey, topic, macroArea, macrotopic);
    const subtopicKey = `${topicKey}|${subtopic}`;
    const subtopicNode = ensureSubtopicNode(
      subtopicKey,
      subtopic,
      macroArea,
      macrotopic,
      topic
    );

    // Create links
    ensureLink(macroAreaNode.id, macrotopicNode.id);
    ensureLink(macrotopicNode.id, topicNode.id);
    ensureLink(topicNode.id, subtopicNode.id);
  }

  console.log(`✓ Created ${nodeMaps.MacroArea.size} MacroArea nodes`);
  console.log(`✓ Created ${nodeMaps.Macrotopic.size} Macrotopic nodes`);
  console.log(`✓ Created ${nodeMaps.Topic.size} Topic nodes`);
  console.log(`✓ Created ${nodeMaps.Subtopic.size} Subtopic nodes`);
  console.log(`✓ Created ${links.length} links\n`);

  // Sort nodes
  const sortedNodes = groupOrder.flatMap((group) => {
    const items = Array.from(nodeMaps[group].values());

    if (group === "MacroArea") {
      const known = items
        .filter((node) => macroAreaOrder.includes(node.label))
        .sort((a, b) => macroAreaIndex(a.label) - macroAreaIndex(b.label));
      const unknown = items
        .filter((node) => !macroAreaOrder.includes(node.label))
        .sort((a, b) => a.label.localeCompare(b.label));
      return [...known, ...unknown];
    }

    return items.sort((a, b) => {
      const macroAreaA = "macroArea" in a ? a.macroArea : "";
      const macroAreaB = "macroArea" in b ? b.macroArea : "";
      const areaDiff = macroAreaIndex(macroAreaA) - macroAreaIndex(macroAreaB);
      if (areaDiff !== 0) return areaDiff;
      return a.label.localeCompare(b.label);
    });
  });

  // Sort links
  const sortedLinks = links.sort((a, b) => {
    if (a.source === b.source) {
      return a.target.localeCompare(b.target);
    }
    return a.source.localeCompare(b.source);
  });

  // Create output
  const output: MainGraphData = {
    nodes: sortedNodes,
    links: sortedLinks,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log(`✅ Main graph exported to ${OUTPUT_PATH}`);
  console.log(`📈 Total nodes: ${sortedNodes.length}`);
  console.log(`📈 Total links: ${sortedLinks.length}\n`);
}

// ============================================================================
// Execute
// ============================================================================

generateMainGraph().catch((error) => {
  console.error("❌ Error generating main graph:", error);
  process.exit(1);
});
