// TODO: 
// [x] props should be conditional, for example the control panel on the main graph should have everything except show labels
// [x] colours need to be dynamic in response to dark mode and light, not hard coded

import { useTheme } from "@/lib/ThemeContext";


const LIGHT_PANEL_BG = "rgba(255, 255, 255, 0.5)";
const LIGHT_PANEL_BORDER = "1px solid #e5e7eb";
const LIGHT_TEXT_PRIMARY = "#111827";
const LIGHT_TEXT_MUTED = "#4b5563";

const DARK_PANEL_BG = "rgba(15, 15, 15, 0.5)";      // slate-950-ish
const DARK_PANEL_BORDER = "1px solid rgb(62, 65, 70)";  // gray-800-ish
const DARK_TEXT_PRIMARY = "#f9fafb";  // near-white
const DARK_TEXT_MUTED = "#9ca3af";    // gray-400-ish

type GraphControlsProps = {
    onZoomIn?: () => void;
    onZoomOut?: () => void;

    showLabels?: boolean;
    onToggleLabels?: () => void;

    showListView?: boolean;
    onToggleListView?: () => void;

    reducedMotion?: boolean;
    onToggleReducedMotion?: () => void;

    setTheme?: string;
    onToggleTheme?: () => void;

    showLinks?: boolean;
    onToggleLinks?: () => void;
};

export function GraphControls({
    onZoomIn,
    onZoomOut,
    showLabels,
    onToggleLabels,
    showListView,
    onToggleListView,
    reducedMotion,
    onToggleReducedMotion,
    setTheme,
    onToggleTheme,
    showLinks,
    onToggleLinks
}: GraphControlsProps) {

    // truthy handlers to show certain controls and hide others
    const hasZoom = !!onZoomIn && !!onZoomOut;
    const hasLabelToggle =
        typeof showLabels === "boolean" && !!onToggleLabels;
    const hasListToggle =
        typeof showListView === "boolean" && !!onToggleListView;
    const hasReducedMotionToggle =
        typeof reducedMotion === "boolean" && !!onToggleReducedMotion;
    const hasThemeToggle =
        typeof setTheme === "string" && !!onToggleTheme;
    const hasLinksToggle =
        typeof showLinks === "boolean" && !!onToggleLinks;

    // If nothing is wired, don’t render anything
    if (!hasZoom && !hasLabelToggle && !hasListToggle && !hasReducedMotionToggle && !hasThemeToggle && !hasLinksToggle) {
        return null;
    }

    const { theme } = useTheme();


    return (
        <section
            aria-label="Graph controls"
            style={{
                position: "absolute",
                left: "16px",
                bottom: "16px",
                zIndex: 1000,
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                border: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)", // Safari
                gap: "8px",
                minWidth: "200px",
            }}
        >
            <h2
                style={{
                    margin: 0,
                    marginBottom: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    //change
                    color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                }}
            >
                Controls
            </h2>

            {/* Zoom controls */}
            <div
                aria-label="Zoom controls"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <span
                    style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                        minWidth: "48px",
                    }}
                >
                    Zoom
                </span>
                <div
                    style={{
                        display: "flex",
                        gap: "4px",
                    }}
                >
                    <button
                        type="button"
                        onClick={onZoomOut}
                        aria-label="Zoom out"
                        style={getControlButtonStyle(theme)}
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={onZoomIn}
                        aria-label="Zoom in"
                        style={getControlButtonStyle(theme)}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Label toggle */}
            {hasLabelToggle &&
                <ToggleRow
                    label="Labels"
                    description="Show question labels"
                    pressed={showLabels}
                    onToggle={onToggleLabels}
                    theme={theme}
                />
            }

            {/* List-view toggle */}
            {hasListToggle &&
                <ToggleRow
                    label="List view"
                    description="Show sidebar list of nodes"
                    pressed={showListView}
                    onToggle={onToggleListView}
                    theme={theme}
                />
            }

            {/* Reduced motion toggle */}
            {hasReducedMotionToggle &&
                <ToggleRow
                    label="Reduced motion"
                    description="Limit pan/zoom animation"
                    pressed={reducedMotion}
                    onToggle={onToggleReducedMotion}
                    theme={theme}
                />
            }
            {/* Theme toggle */}
            {hasThemeToggle &&
                <ToggleRow
                    label="Theme"
                    description="Change theme between dark and light"
                    pressed={setTheme === "dark"}
                    onToggle={onToggleTheme}
                    displayValue={setTheme === "dark" ? "Dark" : "Light"}
                    theme={theme}
                />
            }

            {/* Links between nodes toggle */}
            {hasLinksToggle &&
                <ToggleRow
                    label="Links"
                    description="Show or hide links between nodes"
                    pressed={showLinks}
                    onToggle={onToggleLinks}
                    theme={theme}
                />
            }
        </section>
    );
}

const getControlButtonStyle = (theme: string): React.CSSProperties => ({
    width: "30px",
    height: "30px",
    borderRadius: "4px",
    color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
    border: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

type ToggleRowProps = {
    label: string;
    description?: string;
    pressed: boolean;
    onToggle: () => void;
    displayValue?: string;
    theme: "light" | "dark"
};

function ToggleRow({ label, description, pressed, onToggle, displayValue, theme }: ToggleRowProps) {
    const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                    htmlFor={id}
                    style={{
                        fontSize: "12px",
                        fontWeight: 500,
                    }}
                >
                    {label}
                </label>
                {description && (
                    <span
                        style={{
                            fontSize: "10px",

                            color: theme === "light" ? LIGHT_TEXT_MUTED : DARK_TEXT_MUTED,
                        }}
                    >
                        {description}
                    </span>
                )}
            </div>

            <button
                id={id}
                type="button"
                onClick={onToggle}
                aria-pressed={pressed}
                style={{
                    minWidth: "52px",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    border: "1px solid",

                    color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                    borderColor: pressed ? "#0f766e" : (theme === "dark" ? "" : ""),
                    backgroundColor: pressed ?
                        theme === "light" ? "#d1fae5" : "#052e19"
                        : "",

                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                }}
            >
                {displayValue ?? (pressed ? "On" : "Off")}
            </button>
        </div>
    );
}
