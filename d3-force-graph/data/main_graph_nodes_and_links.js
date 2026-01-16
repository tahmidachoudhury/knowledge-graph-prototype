import fs from "fs";

const RAW_DATA_PATH = new URL("./qna_enriched.json", import.meta.url);
const OUTPUT_PATH = new URL("./tq_db_nodes_and_links.json", import.meta.url);

// Load your raw dataset
const data = JSON.parse(fs.readFileSync(RAW_DATA_PATH, "utf8"));

// Defined MacroAreas
const macroareas = {
  Environment: [
    "Clean water and sanitation",
    "Climate action",
    "Life below water",
    "Life on land",
    "Sustainable consumption and production",
    "Clean energy",
    //does smart cities go here
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

// Build lookup table for macrotopic -> macro area
const macroAreaLookup = new Map();
for (const [macroArea, macrotopics] of Object.entries(macroareas)) {
  macrotopics.forEach((macrotopic) => {
    macroAreaLookup.set(macrotopic.toLowerCase(), macroArea);
  });
}
const macroAreaOrder = Object.keys(macroareas);
const groupOrder = ["MacroArea", "Macrotopic", "Topic", "Subtopic"];

const nodeMaps = {
  MacroArea: new Map(),
  Macrotopic: new Map(),
  Topic: new Map(),
  Subtopic: new Map(),
};
const links = [];
const linkSet = new Set();

const sanitize = (value, fallback) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length) return trimmed;
  }
  return fallback;
};

const macroAreaIndex = (name) => {
  const idx = macroAreaOrder.indexOf(name);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

const ensureNode = ({ group, key, label, ...rest }) => {
  const map = nodeMaps[group];
  if (!map.has(key)) {
    map.set(key, {
      id: `${group}:${key}`,
      label,
      group,
      ...rest,
    });
  }
  return map.get(key);
};

const ensureLink = (source, target) => {
  const key = `${source}→${target}`;
  if (linkSet.has(key)) return;
  links.push({ source, target, value: 1 });
  linkSet.add(key);
};

for (const entry of data) {
  const macrotopic = sanitize(entry.Macrotopic, "Unknown Macrotopic");
  const topic = sanitize(entry.Topic, "Unknown Topic");
  const subtopic = sanitize(entry.Subtopic, "Unknown Subtopic");

  const macroArea =
    macroAreaLookup.get(macrotopic.toLowerCase()) || "Unmapped Macrotopic";

  const macroAreaNode = ensureNode({
    group: "MacroArea",
    key: macroArea,
    label: macroArea,
  });

  const macrotopicKey = `${macroArea}|${macrotopic}`;
  const macrotopicNode = ensureNode({
    group: "Macrotopic",
    key: macrotopicKey,
    label: macrotopic,
    macroArea,
  });

  const topicKey = `${macrotopicKey}|${topic}`;
  const topicNode = ensureNode({
    group: "Topic",
    key: topicKey,
    label: topic,
    macroArea,
    macrotopic,
  });

  const subtopicKey = `${topicKey}|${subtopic}`;
  const subtopicNode = ensureNode({
    group: "Subtopic",
    key: subtopicKey,
    label: subtopic,
    macroArea,
    macrotopic,
    topic,
  });

  ensureLink(macroAreaNode.id, macrotopicNode.id);
  ensureLink(macrotopicNode.id, topicNode.id);
  ensureLink(topicNode.id, subtopicNode.id);
}

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
    const areaDiff = macroAreaIndex(a.macroArea) - macroAreaIndex(b.macroArea);
    if (areaDiff !== 0) return areaDiff;
    return a.label.localeCompare(b.label);
  });
});

const sortedLinks = links.sort((a, b) => {
  if (a.source === b.source) {
    return a.target.localeCompare(b.target);
  }
  return a.source.localeCompare(b.source);
});

const output = {
  nodes: sortedNodes,
  links: sortedLinks,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log("✅ Nodes + links exported → tq_db_nodes_and_links.json");
