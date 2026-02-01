import { QnaNode } from "@/lib/types/graph.types"

type QuestionListProps = {
    macroArea?: string
    subtopic: string
    nodes: QnaNode[]
    onSelectQuestion: (id: string) => void
}

export function QuestionListPanel({
    macroArea,
    subtopic,
    nodes,
    onSelectQuestion,
}: QuestionListProps) {
    return (
        <aside
            aria-label={`Questions for ${subtopic} in ${macroArea}`}
            style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100vh",
                width: "320px",
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
                    {nodes.map((node) => (
                        <li key={node.id} style={{ marginBottom: "8px" }}>
                            <button
                                type="button"
                                onClick={() => onSelectQuestion(node.id)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    fontSize: "14px",
                                    borderRadius: "4px",
                                    border: "1px solid #e5e7eb",
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
