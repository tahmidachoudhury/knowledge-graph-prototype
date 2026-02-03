type KnowledgeMapBreadcrumbProps = {
    macroArea?: string
    subtopic?: string
    theme?: "light" | "dark"
}

export function KnowledgeMapBreadcrumb({
    macroArea,
    subtopic,
    theme = "light",
}: KnowledgeMapBreadcrumbProps) {
    return (
        <div
            className={theme === "light" ? "theme-light" : "theme-dark"}
            style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                padding: "10px 20px",
                fontSize: "18px",
                fontWeight: "bold",
                border: "2px solid",
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.5)" : "rgba(15, 15, 15, 0.5)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)", // Safari
            }}
            aria-live="polite"
        >
            Map of knowledge &gt; {macroArea}
            {subtopic && <> &gt; {subtopic}</>}
        </div>
    )
}
