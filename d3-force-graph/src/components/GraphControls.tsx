type GraphControlsProps = {
    onZoomIn: () => void;
    onZoomOut: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    showListView: boolean;
    onToggleListView: () => void;
    reducedMotion: boolean;
    onToggleReducedMotion: () => void;
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
}: GraphControlsProps) {
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
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
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
                    color: "#4b5563",
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
                        color: "#6b7280",
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
                        style={controlButtonStyle}
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={onZoomIn}
                        aria-label="Zoom in"
                        style={controlButtonStyle}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Label toggle */}
            <ToggleRow
                label="Labels"
                description="Show question labels"
                pressed={showLabels}
                onToggle={onToggleLabels}
            />

            {/* List-view toggle */}
            <ToggleRow
                label="List view"
                description="Show sidebar list of nodes"
                pressed={showListView}
                onToggle={onToggleListView}
            />

            {/* Reduced motion toggle */}
            <ToggleRow
                label="Reduced motion"
                description="Limit pan/zoom animation"
                pressed={reducedMotion}
                onToggle={onToggleReducedMotion}
            />
        </section>
    );
}

const controlButtonStyle: React.CSSProperties = {
    width: "30px",
    height: "30px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

type ToggleRowProps = {
    label: string;
    description?: string;
    pressed: boolean;
    onToggle: () => void;
};

function ToggleRow({ label, description, pressed, onToggle }: ToggleRowProps) {
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
                        color: "#374151",
                    }}
                >
                    {label}
                </label>
                {description && (
                    <span
                        style={{
                            fontSize: "10px",
                            color: "#6b7280",
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
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: pressed ? "#0f766e" : "#d1d5db",
                    backgroundColor: pressed ? "#d1fae5" : "#f9fafb",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                }}
            >
                {pressed ? "On" : "Off"}
            </button>
        </div>
    );
}
