// src/lib/graph/labels.ts
import type * as d3 from "d3";

interface LabelOptions {
    label: string;
    maxWidth: number;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    lineHeight?: number;
    paddingX?: number;
    paddingY?: number;
    bgColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

/**
 * Appends a multi-line text label with a rounded-rect background
 * centered on (0,0) within the given node <g>.
 *
 */
export function addWrappedLabelWithBackground<
    T extends d3.BaseType,
    D
>(
    nodeElement: d3.Selection<SVGGElement, D, T, unknown>,
    {
        label,
        maxWidth,
        textColor = "#ffffff",
        fontSize = 13,
        fontFamily = "sans-serif",
        fontWeight = 600,
        lineHeight = 16,
        paddingX = 10,
        paddingY = 6,
        bgColor = "rgb(0, 0, 0)",
    }: LabelOptions
) {
    const words = label.split(/\s+/);
    const lines: string[] = [];
    let currentLine: string[] = [];

    const charWidth = 7; // rough estimate just for wrapping

    words.forEach((word) => {
        const testLine = currentLine.length
            ? currentLine.join(" ") + " " + word
            : word;
        const estimatedWidth = testLine.length * charWidth;

        if (estimatedWidth > maxWidth && currentLine.length) {
            lines.push(currentLine.join(" "));
            currentLine = [word];
        } else {
            currentLine.push(word);
        }
    });

    if (currentLine.length) lines.push(currentLine.join(" "));

    // Group to hold rect + text
    const labelGroup = nodeElement
        .append("g")
        .attr("pointer-events", "none");

    const textElement = labelGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", textColor)
        .attr("font-size", fontSize)
        .attr("font-weight", fontWeight)
        .attr("font-family", fontFamily);

    const startY = (-(lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
        textElement
            .append("tspan")
            .attr("x", 0)
            .attr("y", startY + i * lineHeight)
            .text(line);
    });

    // Create rect first (will size it after layout)
    const rect = labelGroup
        .insert("rect", "text")
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", bgColor)


    const updateRectFromBBox = () => {
        const node = textElement.node() as SVGTextElement | null;
        if (!node) return;

        const bbox = node.getBBox();

        rect
            .attr("x", bbox.x - paddingX)
            .attr("y", bbox.y - paddingY)
            .attr("width", bbox.width + paddingX * 2)
            .attr("height", bbox.height + paddingY * 2);
    };

    // Defer measurement to let browser lay out tspans/fonts
    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
        requestAnimationFrame(updateRectFromBBox);
    } else {
        // Fallback (SSR / non-window envs)
        updateRectFromBBox();
    }

    return labelGroup;
}
