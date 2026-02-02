import { QnaNode } from "@/lib/types/graph.types"
import { useCallback, useState } from "react"

// TODO 
// x sidebar needs to be toggleable
//? - responsive for mobile
//? - Add the sidebar.tsx to the main graph too

type QuestionListProps = {
    macroArea?: string
    subtopic: string
    nodes: QnaNode[]
    onSelectQuestion: (qna: QnaNode) => void
}

export function QuestionListPanel({
    macroArea,
    subtopic,
    nodes,
    onSelectQuestion,
}: QuestionListProps) {

    const [activeIndex, setActiveIndex] = useState(0)

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
            if (event.key === "ArrowDown") {
                event.preventDefault()
                const nextIndex = (index + 1) % nodes.length
                setActiveIndex(nextIndex)
                const next = document.querySelector<HTMLButtonElement>(
                    `[data-question-index="${nextIndex}"]`,
                )
                next?.focus()
            } else if (event.key === "ArrowUp") {
                event.preventDefault()
                const prevIndex = (index - 1 + nodes.length) % nodes.length
                setActiveIndex(prevIndex)
                const prev = document.querySelector<HTMLButtonElement>(
                    `[data-question-index="${prevIndex}"]`,
                )
                prev?.focus()
            } else if (event.key === "Home") {
                event.preventDefault()
                setActiveIndex(0)
                document
                    .querySelector<HTMLButtonElement>(`[data-question-index="0"]`)
                    ?.focus()
            } else if (event.key === "End") {
                event.preventDefault()
                const lastIndex = nodes.length - 1
                setActiveIndex(lastIndex)
                document
                    .querySelector<HTMLButtonElement>(
                        `[data-question-index="${lastIndex}"]`,
                    )
                    ?.focus()
            }
        },
        [nodes.length],
    )



    return (
        <aside
            aria-label={`Questions for ${subtopic} in ${macroArea}`}
            style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100vh",
                width: "320px",
                // zIndex: "1000",
                borderLeft: "1px solid #e5e7eb",
                padding: "16px",
                overflowY: "auto",
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
                <p
                    style={{
                        fontSize: "12px",
                        margin: 0,
                    }}
                >
                    {macroArea}
                </p>
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

                                    cursor: "pointer",
                                }}
                            >
                                {node.question}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}
