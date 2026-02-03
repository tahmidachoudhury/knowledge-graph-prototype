import { GraphSidebarProps } from "@/lib/types/graph.types";
import { useCallback, useState } from "react";

export function GraphSidebar(props: GraphSidebarProps) {
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
                    borderLeft: "1px solid #e5e7eb",
                    padding: "16px",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                }}
            >
                <header>
                    <h2
                        style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            margin: "0 0 4px",
                        }}
                    >
                        {subtopic}
                    </h2>
                    {macroArea && (
                        <p
                            style={{
                                fontSize: "12px",
                                margin: 0,
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
                        borderTop: "1px solid #e5e7eb",
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
                                        borderRadius: "0px",
                                        border: "1px solid #e5e7eb",
                                        cursor: "pointer",
                                        backgroundColor:
                                            index === activeIndex ? "#e0f2fe" : "#f9fafb",
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
                borderLeft: "1px solid #e5e7eb",
                padding: "16px",
                overflowY: "auto",
                backgroundColor: "#ffffff",
            }}
        >
            <header>
                <h2
                    style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        // extra margin top to view buttons
                        margin: "60px 0 4px 0",
                    }}
                >
                    {macroArea}
                </h2>
                <p
                    style={{
                        fontSize: "12px",
                        margin: 0,
                        color: "#4b5563",
                    }}
                >
                    Macrotopics, topics and subtopics
                </p>
            </header>

            <hr
                style={{
                    margin: "12px 0",
                    border: 0,
                    borderTop: "1px solid #e5e7eb",
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
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        fontSize: "14px",
                                        borderRadius: "4px",
                                        border: "1px solid #d1d5db",
                                        backgroundColor: macroOpen ? "#e5f3ff" : "#f9fafb",
                                        cursor: "pointer",
                                    }}
                                >
                                    {mt.macrotopic.label}
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
                                                <li key={node.topic.id} style={{ marginBottom: "4px" }}>
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
                                                            display: "block",
                                                            width: "100%",
                                                            textAlign: "left",
                                                            padding: "6px 8px",
                                                            fontSize: "13px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #e5e7eb",
                                                            backgroundColor: topicOpen
                                                                ? "#f3f4ff"
                                                                : "#ffffff",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {node.topic.label}
                                                    </button>

                                                    {topicOpen && (
                                                        <ul
                                                            aria-label={`Subtopics in ${node.topic.label}`}
                                                            style={{
                                                                listStyle: "none",
                                                                padding: "4px 0 0 12px",
                                                                margin: 0,
                                                            }}
                                                        >
                                                            {node.subtopics.map((node) => (
                                                                <li key={node.id} style={{ marginBottom: "4px" }}>
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
                                                                            border: "1px solid #e5e7eb",
                                                                            backgroundColor: "#f9fafb",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        {node.label}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside >
    );
}
