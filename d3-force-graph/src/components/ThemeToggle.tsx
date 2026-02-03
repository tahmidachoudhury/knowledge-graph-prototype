import { ThemeValue } from "@/lib/types/graph.types";
import * as React from "react";

//! This component is currently deprecated and not in use: main d494c01
interface ThemeToggleProps {
    theme: ThemeValue;
    onToggle: () => void;
    style?: React.CSSProperties; // positioning lives with the parent
}

export function ThemeToggle({
    theme,
    onToggle,
    style,
}: ThemeToggleProps) {
    const isLight = theme === "light";

    const baseStyles: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "8px 16px",
        fontSize: "16px",
        fontWeight: 600,

        borderRadius: "6px",
        border: "2px solid",

        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        cursor: "pointer",
        transition: "background-color 0.15s ease, color 0.15s ease",
    };

    const lightStyles: React.CSSProperties = {
        backgroundColor: "#ffffff",
        color: "#1f2937",
        borderColor: "#1f2937",
    };

    const darkStyles: React.CSSProperties = {
        backgroundColor: "#1a1a1a",
        color: "#f9fafb",
        borderColor: "#f9fafb",
    };

    return (
        <button
            type="button"
            onClick={onToggle}
            style={{
                ...baseStyles,
                ...(isLight ? lightStyles : darkStyles),
                ...style,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight
                    ? "#f9fafb"
                    : "#262626";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight
                    ? "#ffffff"
                    : "#1a1a1a";
            }}
        >
            {isLight ? "🌙 Dark" : "☀️ Light"}
        </button>
    );
}
