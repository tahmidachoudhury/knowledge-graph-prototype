import { useTheme } from "@/lib/ThemeContext";
import { GraphSidebarProps } from "@/lib/types/graph.types";
import { useCallback, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// TODO: 
// [x] colours need to be dynamic in response to dark mode and light, not hard coded

const LIGHT_PANEL_BG = "rgba(255, 255, 255, 0.5)";
const LIGHT_PANEL_BORDER = "1px solid #e5e7eb";
const LIGHT_TEXT_PRIMARY = "#111827";
const LIGHT_TEXT_MUTED = "#4b5563";

const DARK_PANEL_BG = "rgba(15, 15, 15, 0.5)";      // slate-950-ish
const DARK_PANEL_BORDER = "1px solid rgb(36, 42, 49)";  // gray-800-ish
const DARK_TEXT_PRIMARY = "#f9fafb";  // near-white
const DARK_TEXT_MUTED = "#9ca3af";    // gray-400-ish

export function GraphSidebar(props: GraphSidebarProps) {

    const { theme } = useTheme()

    if (props.variant === "qna") {
        const { macroArea, subtopic, nodes, onSelectQuestion } = props;
        const [activeIndex, setActiveIndex] = useState(0);

        const handleKeyDown = useCallback(
            (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    const nextIndex = (index + 1) % nodes.length;
                    setActiveIndex(nextIndex);
                    const next = document.querySelector<HTMLButtonElement>(
                        `[data-question-index="${nextIndex}"]`,
                    );
                    next?.focus();
                } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    const prevIndex = (index - 1 + nodes.length) % nodes.length;
                    setActiveIndex(prevIndex);
                    const prev = document.querySelector<HTMLButtonElement>(
                        `[data-question-index="${prevIndex}"]`,
                    );
                    prev?.focus();
                } else if (event.key === "Home") {
                    event.preventDefault();
                    setActiveIndex(0);
                    document
                        .querySelector<HTMLButtonElement>(`[data-question-index="0"]`)
                        ?.focus();
                } else if (event.key === "End") {
                    event.preventDefault();
                    const lastIndex = nodes.length - 1;
                    setActiveIndex(lastIndex);
                    document
                        .querySelector<HTMLButtonElement>(
                            `[data-question-index="${lastIndex}"]`,
                        )
                        ?.focus();
                }
            },
            [nodes.length],
        );

        return (
            <aside
                aria-label={`Questions for ${subtopic}${macroArea ? ` in ${macroArea}` : ""
                    }`}
                style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100vh",
                    width: "320px",
                    padding: "16px",
                    overflowY: "auto",
                    borderLeft: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                    backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                    // Below gives that frosted look
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)", // Safari
                }}
            >
                <header>
                    <h2
                        style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            margin: "0 0 4px",
                            color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                        }}
                    >
                        {subtopic}
                    </h2>
                    {macroArea && (
                        <p
                            style={{
                                fontSize: "12px",
                                margin: 0,
                                color: theme === "light" ? LIGHT_TEXT_MUTED : DARK_TEXT_MUTED,
                            }}
                        >
                            {macroArea}
                        </p>
                    )}
                </header>

                <hr
                    style={{
                        margin: "12px 0",
                        border: 0,
                        // change
                        borderTop: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                    }}
                />

                <nav aria-label="Questions">
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                        }}
                    >
                        {nodes.map((node, index) => (
                            <li key={node.id} style={{ marginBottom: "8px" }}>
                                <button
                                    type="button"
                                    data-question-index={index}
                                    tabIndex={index === activeIndex ? 0 : -1}
                                    onClick={() => onSelectQuestion(node)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        fontSize: "14px",
                                        borderRadius: "5px",
                                        color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                                        border: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                                        cursor: "pointer",
                                        backgroundColor:
                                            index === activeIndex ?
                                                theme === "light" ? "#d1fae5" : "#052e19"
                                                : "",
                                    }}
                                >
                                    {node.question}

                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        );
    }

    // ------------------------
    // HIERARCHY VARIANT (MAIN GRAPH)
    // ------------------------

    const { macroArea, macrotopics, onSelectSubtopic } = props;
    const [openMacroId, setOpenMacroId] = useState<string | null>(null);
    const [openTopicId, setOpenTopicId] = useState<string | null>(null);

    return (
        <aside
            aria-label={`Navigation for ${macroArea}`}
            style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100vh",
                width: "320px",
                padding: "16px",
                overflowY: "auto",
                borderLeft: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                // Below gives that frosted look
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)", // Safari
            }}
        >
            <header>
                <h2
                    style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        margin: "0 0 4px",
                        color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                    }}
                >
                    {macroArea}
                </h2>
                <p
                    style={{
                        fontSize: "12px",
                        margin: 0,
                        color: theme === "light" ? LIGHT_TEXT_MUTED : DARK_TEXT_MUTED,
                    }}
                >
                    Macrotopics, topics and subtopics
                </p>
            </header>

            <hr
                style={{
                    margin: "12px 0",
                    border: 0,
                    // change
                    borderTop: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                }}
            />

            <nav aria-label="Macrotopics, topics and subtopics">
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                    }}
                >
                    {macrotopics.map((mt) => {
                        const macroOpen = openMacroId === mt.macrotopic.id;
                        return (
                            <li key={mt.macrotopic.id} style={{ marginBottom: "8px" }}>
                                {/* Macrotopic button */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenMacroId((prev) => (prev === mt.macrotopic.id ? null : mt.macrotopic.id))
                                    }
                                    aria-expanded={macroOpen}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        fontSize: "14px",
                                        borderRadius: "4px",
                                        color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                                        // border: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                                        backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                                        cursor: "pointer",
                                    }}
                                >
                                    {mt.macrotopic.label}
                                    <ExpandMoreIcon
                                        style={{
                                            transition: "transform 200ms ease",
                                            transform: macroOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        }}
                                    />
                                </button>

                                {macroOpen && (
                                    <ul
                                        aria-label={`Topics in ${mt.macrotopic.label}`}
                                        style={{
                                            listStyle: "none",
                                            padding: "4px 0 0 12px",
                                            margin: 0,
                                        }}
                                    >
                                        {mt.topics.map((node) => {
                                            const topicOpen = openTopicId === node.topic.id;
                                            return (
                                                <li key={node.topic.id} style={{ paddingBottom: "4px", borderLeft: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER }}>
                                                    {/* Topic button */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenTopicId((prev) =>
                                                                prev === node.topic.id ? null : node.topic.id,
                                                            )
                                                        }
                                                        aria-expanded={topicOpen}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            width: "100%",
                                                            textAlign: "left",
                                                            padding: "6px 8px",
                                                            fontSize: "13px",
                                                            borderRadius: "4px",
                                                            // change
                                                            color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                                                            // borderLeft: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                                                            backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {node.topic.label}
                                                        <ExpandMoreIcon
                                                            style={{
                                                                transition: "transform 200ms ease",
                                                                transform: topicOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                            }}
                                                        />
                                                    </button>

                                                    {
                                                        topicOpen && (
                                                            <ul
                                                                aria-label={`Subtopics in ${node.topic.label}`}
                                                                style={{
                                                                    listStyle: "none",
                                                                    padding: "4px 0 0 12px",
                                                                    margin: 0,
                                                                }}
                                                            >
                                                                {node.subtopics.map((node) => (
                                                                    <li key={node.id} style={{ paddingBottom: "4px", borderLeft: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                onSelectSubtopic(node.id)
                                                                            }
                                                                            style={{
                                                                                display: "block",
                                                                                width: "100%",
                                                                                textAlign: "left",
                                                                                padding: "4px 8px",
                                                                                fontSize: "12px",
                                                                                borderRadius: "4px",
                                                                                // change
                                                                                color: theme === "light" ? LIGHT_TEXT_PRIMARY : DARK_TEXT_PRIMARY,
                                                                                // border: theme === "light" ? LIGHT_PANEL_BORDER : DARK_PANEL_BORDER,
                                                                                backgroundColor: theme === "light" ? LIGHT_PANEL_BG : DARK_PANEL_BG,
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            {node.label}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )
                                                    }
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )
                                }
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside >
    );
}
