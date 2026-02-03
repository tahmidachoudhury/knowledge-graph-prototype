import * as React from "react";

type ThemeValue = "light" | "dark" | string;

interface HoverTooltipProps {
    text: React.ReactNode;
    position: { x: number; y: number } | null;
    theme: ThemeValue;
    offsetX?: number;
    offsetY?: number;
}

export function HoverTooltip({
    text,
    position,
    theme,
    offsetX = 10,
    offsetY = 10,
}: HoverTooltipProps) {
    if (!position || text == null) return null;

    const isLight = theme === "light";

    const baseStyles: React.CSSProperties = {
        position: "absolute",
        left: position.x + offsetX,
        top: position.y + offsetY,
        zIndex: 1000,
        padding: "10px 20px",
        fontSize: "16px",
        borderWidth: 2,
        borderStyle: "solid",
        borderRadius: "5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
        maxWidth: "320px",
    };



    return (
        <div
            className={"theme-hover theme-dark"}
            style={{
                ...baseStyles,
            }}
        >
            {text}
        </div>
    );
}
