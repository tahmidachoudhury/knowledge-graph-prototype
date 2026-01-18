// scripts/generateSubtopicQnas.ts

import fs from "fs";
import path from "path";
import type {
  SubtopicNode,
  QnaNode,
  GraphLink,
  SubtopicQnaGraphData,
} from "../src/lib/types/graph.types";

// ============================================================================
// Configuration
// ============================================================================

const RAW_DATA_PATH = "./data/qna_enriched.json";
const MAIN_GRAPH_PATH = "./data/main_graph.json";
const OUTPUT_DIR = "./data/qnas";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Main Processing Function
// ============================================================================

interface GroupedQnas {
  [subtopicId: string]: {
    subtopicNode: SubtopicNode;
    qnas: any[];
  };
}

async function generateSubtopicQnaFiles(): Promise<void> {
  console.log("📊 Starting subtopic QnA generation...\n");

  // Read raw QnA data
  const rawData: any[] = JSON.parse(
    fs.readFileSync(RAW_DATA_PATH, "utf-8")
  );
  console.log(`✓ Loaded ${rawData.length} QnA entries`);

  // Read main graph to get subtopic nodes
  const mainGraph = JSON.parse(fs.readFileSync(MAIN_GRAPH_PATH, "utf-8"));
  const subtopicNodes = mainGraph.nodes.filter(
    (node: any) => node.group === "Subtopic"
  ) as SubtopicNode[];
  console.log(`✓ Found ${subtopicNodes.length} subtopic nodes\n`);

  // Create subtopic lookup by key
  const subtopicLookup = new Map<string, SubtopicNode>();
  for (const node of subtopicNodes) {
    // Extract key from id (format: "Subtopic:key")
    const key = node.id.replace("Subtopic:", "");
    subtopicLookup.set(key, node);
  }

  // Group QnAs by subtopic
  const grouped: GroupedQnas = {};

  for (const entry of rawData) {
    const macrotopic = sanitize(entry.Macrotopic, "Unknown Macrotopic");
    const topic = sanitize(entry.Topic, "Unknown Topic");
    const subtopic = sanitize(entry.Subtopic, "Unknown Subtopic");

    // Build the same key structure used in main graph
    const macroAreaLookup = new Map<string, string>();
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

    for (const [macroArea, macrotopics] of Object.entries(macroareas)) {
      macrotopics.forEach((mt) => {
        macroAreaLookup.set(mt.toLowerCase(), macroArea);
      });
    }

    const macroArea =
      macroAreaLookup.get(macrotopic.toLowerCase()) || "Unmapped Macrotopic";
    const macrotopicKey = `${macroArea}|${macrotopic}`;
    const topicKey = `${macrotopicKey}|${topic}`;
    const subtopicKey = `${topicKey}|${subtopic}`;

    // Get the subtopic node
    const subtopicNode = subtopicLookup.get(subtopicKey);

    if (!subtopicNode) {
      console.warn(`⚠️  Subtopic node not found for key: ${subtopicKey}`);
      continue;
    }

    const subtopicId = subtopicNode.id;

    if (!grouped[subtopicId]) {
      grouped[subtopicId] = {
        subtopicNode,
        qnas: [],
      };
    }

    grouped[subtopicId].qnas.push(entry);
  }
  // To check the original payload from ./data/qna_enriched.json
  // console.log(grouped["Subtopic:Environment|Clean energy|Biomass energy|Bioenergy conversion technologies"].qnas);

  const subtopicCount = Object.keys(grouped).length;
  console.log(`✓ Grouped into ${subtopicCount} subtopics\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate individual JSON files for each subtopic
  let totalFilesGenerated = 0;

  for (const [subtopicId, group] of Object.entries(grouped)) {
    // Create QnA nodes
    const qnaNodes: QnaNode[] = group.qnas.map((qna, index) => {
      const qnaId = `${subtopicId}_qna_${String(index).padStart(3, "0")}`;

      return {
        id: qnaId,
        group: "QnA",
        label: qna.Label || "",
        question: qna.question,
        answer: qna.answer,
        macroArea: group.subtopicNode.macroArea,
        articlesourceurl: qna.articlesourceurl || "",
        paragraph: qna.paragraph || "",
        macrotopic: qna.Macrotopic,
        topic: qna.Topic,
        subtopic: qna.Subtopic,
        tags: qna.Tags || [],
        viewCount: qna.ViewCount || 0,
      };
    });

    // Create links: subtopic (center) -> each QnA
    const links: GraphLink[] = qnaNodes.map((qnaNode) => ({
      source: subtopicId,
      target: qnaNode.id,
      value: 1,
    }));

    // Optional: Create links between related QnAs (based on shared tags)
    const relatedLinks = generateRelatedLinks(qnaNodes);
    links.push(...relatedLinks);

    // Create final data structure
    const subtopicData: SubtopicQnaGraphData = {
      nodes: [group.subtopicNode, ...qnaNodes],
      links,
    };

    // Generate filename from subtopic ID
    const filename = `${slugify(subtopicId)}.json`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(subtopicData, null, 2),
      "utf-8"
    );

    totalFilesGenerated++;
    // console.log(
    //   `  ✓ ${filename} (${qnaNodes.length} QnAs, ${links.length} links)`
    // );
  }

  // Generate index file for reference
  const indexData = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    subtopics: Object.entries(grouped).map(([subtopicId, group]) => ({
      id: subtopicId,
      label: group.subtopicNode.label,
      qnaCount: group.qnas.length,
      macroArea: group.subtopicNode.macroArea,
      macrotopic: group.subtopicNode.macrotopic,
      topic: group.subtopicNode.topic,
      file: `${slugify(subtopicId)}.json`,
    })),
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "index.json"),
    JSON.stringify(indexData, null, 2),
    "utf-8"
  );

  console.log(
    `\n✅ Successfully generated ${totalFilesGenerated} subtopic QnA files`
  );
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`📄 Index file: ${OUTPUT_DIR}/index.json\n`);

  // Print statistics
  printStatistics(grouped);
}

// ============================================================================
// Helper: Generate Related Links Based on Shared Tags
// ============================================================================

function generateRelatedLinks(qnaNodes: QnaNode[]): GraphLink[] {
  const links: GraphLink[] = [];

  // Only create links if there are shared tags
  for (let i = 0; i < qnaNodes.length; i++) {
    for (let j = i + 1; j < qnaNodes.length; j++) {
      const nodeA = qnaNodes[i];
      const nodeB = qnaNodes[j];

      const tagsA = new Set(nodeA.tags || []);
      const tagsB = new Set(nodeB.tags || []);

      // Count shared tags
      const sharedTags = [...tagsA].filter((tag) => tagsB.has(tag));

      // Create link if they share at least 2 tags
      if (sharedTags.length >= 2) {
        links.push({
          source: nodeA.id,
          target: nodeB.id,
          value: 1,
        });
      }
    }
  }

  return links;
}

// ============================================================================
// Statistics
// ============================================================================

function printStatistics(grouped: GroupedQnas): void {
  const qnaCounts = Object.values(grouped).map((g) => g.qnas.length);
  const total = qnaCounts.reduce((sum, count) => sum + count, 0);
  const avg = Math.round(total / qnaCounts.length);
  const min = Math.min(...qnaCounts);
  const max = Math.max(...qnaCounts);

  console.log("📈 Statistics:");
  console.log(`   Total QnAs: ${total}`);
  console.log(`   Total Subtopics: ${qnaCounts.length}`);
  console.log(`   Avg QnAs per subtopic: ${avg}`);
  console.log(`   Min QnAs: ${min}`);
  console.log(`   Max QnAs: ${max}`);
}

// ============================================================================
// Execute
// ============================================================================

generateSubtopicQnaFiles().catch((error) => {
  console.error("❌ Error generating subtopic QnA files:", error);
  process.exit(1);
});
