import type {
    GraphNode,
    MacrotopicNode,
    TopicNode,
    SubtopicNode,
    GraphLink,
} from "./types/graph.types";

/**
 * Generate additional synthetic Macrotopic clusters (macrotopic + its topics +
 * subtopics + internal links) for demo / density purposes.
 *
 * - Does NOT mutate the original arrays.
 * - Only duplicates clusters rooted at nodes with group === "Macrotopic".
 * - Adds `isSynthetic: true` flag and unique IDs for all duplicated nodes.
 *
 * @param baseNodes Original graph nodes (already filtered to a macroArea scope).
 * @param baseLinks Links between those nodes (already filtered to the same scope).
 * @param factor Scaling factor (1 = no extra clusters, 2 = +1 copy per macrotopic, etc.).
 */
export function generateFakeMacrotopicNodes(
    baseNodes: GraphNode[],
    baseLinks: GraphLink[],
    extraClustersRequested: number
): { nodes: GraphNode[]; links: GraphLink[] } {
    const macrotopics = baseNodes.filter(
        (n): n is MacrotopicNode => n.group === "Macrotopic"
    );

    const MAX_CLUSTERS = 20;
    const originalClusterCount = macrotopics.length;
    const maxExtraAllowed = Math.max(0, MAX_CLUSTERS - originalClusterCount);
    const safeExtra =
        Math.min(
            maxExtraAllowed,
            Math.max(0, Math.floor(extraClustersRequested) || 0)
        );

    if (safeExtra <= 0 || macrotopics.length === 0) {
        // Return shallow copies to avoid accidental mutations by callers
        return { nodes: [...baseNodes], links: [...baseLinks] };
    }

    const syntheticNodes: GraphNode[] = [];
    const syntheticLinks: GraphLink[] = [];

    // Precompute per-macrotopic cluster composition for reuse
    const clusters = macrotopics.map((mt) => {
        // Find topics that belong to this macrotopic (by label or id, mirroring sidebar logic)
        const topicsForMacrotopic = baseNodes.filter(
            (n): n is TopicNode =>
                n.group === "Topic" &&
                (n.macrotopic === mt.label || n.macrotopic === mt.id)
        );

        // Find subtopics that belong to those topics (by label or id)
        const subtopicsForMacrotopic = baseNodes.filter(
            (n): n is SubtopicNode =>
                n.group === "Subtopic" &&
                topicsForMacrotopic.some(
                    (topic) =>
                        n.topic === topic.label ||
                        n.topic === topic.id
                )
        );

        const clusterNodeIds = new Set<string>([
            mt.id,
            ...topicsForMacrotopic.map((t) => t.id),
            ...subtopicsForMacrotopic.map((s) => s.id),
        ]);

        // Only duplicate links fully contained within this macrotopic's cluster
        const clusterLinks = baseLinks.filter(
            (link) =>
                clusterNodeIds.has(link.source) && clusterNodeIds.has(link.target)
        );
        return { mt, topicsForMacrotopic, subtopicsForMacrotopic, clusterLinks };
    });

    // Track how many copies each macrotopic has, so suffixes stay predictable
    const copyCountByMacrotopic = new Map<string, number>();

    for (let i = 0; i < safeExtra; i++) {
        const cluster = clusters[i % clusters.length];
        const { mt, topicsForMacrotopic, subtopicsForMacrotopic, clusterLinks } =
            cluster;

        const currentCount = copyCountByMacrotopic.get(mt.id) ?? 0;
        const nextIndex = currentCount + 1;
        copyCountByMacrotopic.set(mt.id, nextIndex);

        const idMap = new Map<string, string>();

        // Macrotopic copy
        const syntheticMacrotopicId = `${mt.id}__synthetic_${nextIndex}`;
        idMap.set(mt.id, syntheticMacrotopicId);
        syntheticNodes.push({
            ...mt,
            id: syntheticMacrotopicId,
            label: mt.label,
            // @ts-expect-error - allow extra flag for debugging / filtering
            isSynthetic: true,
        });

        // Topic copies
        topicsForMacrotopic.forEach((topic) => {
            const syntheticTopicId = `${topic.id}__synthetic_${nextIndex}`;
            idMap.set(topic.id, syntheticTopicId);
            syntheticNodes.push({
                ...topic,
                id: syntheticTopicId,
                label: topic.label,
                macrotopic: topic.macrotopic ?? mt.label,
                // @ts-expect-error - allow extra flag for debugging / filtering
                isSynthetic: true,
            });
        });

        // Subtopic copies
        subtopicsForMacrotopic.forEach((sub) => {
            const syntheticSubtopicId = `${sub.id}__synthetic_${nextIndex}`;
            idMap.set(sub.id, syntheticSubtopicId);
            syntheticNodes.push({
                ...sub,
                id: syntheticSubtopicId,
                label: sub.label,
                topic: sub.topic,
                // @ts-expect-error - allow extra flag for debugging / filtering
                isSynthetic: true,
            });
        });

        // Links within this cluster, re-targeted to synthetic node IDs
        clusterLinks.forEach((link) => {
            const newSource = idMap.get(link.source);
            const newTarget = idMap.get(link.target);
            if (!newSource || !newTarget) return;

            syntheticLinks.push({
                ...link,
                source: newSource,
                target: newTarget,
            });
        });
    }

    return {
        nodes: [...baseNodes, ...syntheticNodes],
        links: [...baseLinks, ...syntheticLinks],
    };
}



