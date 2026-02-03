import { ThemeValue } from "@/lib/types/graph.types";
import * as React from "react";

//! This component is currently deprecated and not in use: main c26daf7
interface ShowLinksToggleProps {
    theme: ThemeValue;
    showLinks: boolean;
    onToggle: () => void;
    style?: React.CSSProperties; // positioning (absolute, top, right) passed in

}

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

export function ShowLinksToggle({
    theme,
    showLinks,
    onToggle,
    style,
}: ShowLinksToggleProps) {

    const isLight = theme === "light";


    return (
        <button
            type="button"
            onClick={onToggle}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",

                padding: "8px 16px",
                fontSize: "16px",
                fontWeight: 600,

                ...(isLight ? lightStyles : darkStyles),

                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                cursor: "pointer",
                transition: "background-color 0.15s ease",

                ...style, // allow caller to control position/z-index
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
            }}
        >
            {showLinks ? "🔗 Hide Links" : "🔗 Show Links"}
        </button>
    );
}
