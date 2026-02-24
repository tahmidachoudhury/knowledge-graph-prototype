// src/components/QnaDetailPanel.tsx

import { useEffect, useRef } from "react";

interface QnaNode {
  question: string;
  paragraph?: string;
  answer?: string;
  articlesourceurl?: string;
}

interface Props {
  qna: QnaNode | null;
  onClose: () => void;
}

export function QnaDetailPanel({ qna, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!qna) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    // Optional: lock scroll behind modal
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [qna, onClose]);

  if (!qna) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Question details"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(720px, 100%)",
          maxHeight: "min(80vh, 720px)",
          overflow: "hidden",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              QnA
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                lineHeight: 1.35,
                color: "#111827",
                wordBreak: "break-word",
              }}
            >
              {qna.question}
            </h2>
          </div>

          {/* <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close question details"
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              backgroundColor: "rgba(0,0,0,0.03)",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
              flex: "0 0 auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)";
            }}
          >
            ✕
          </button> */}
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 20px",
            overflowY: "auto",
            maxHeight: "calc(min(80vh, 720px) - 70px)",
            color: "#1f2937",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {/* {qna.paragraph && qna.paragraph.trim() !== "" && (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Paragraph
              </div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "12px",
                  padding: "12px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {qna.paragraph}
              </div>
            </div>
          )} */}

          {qna.answer ? (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Answer
              </div>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.10)",
                  borderRadius: "12px",
                  padding: "12px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {qna.answer}
              </div>
            </div>
          ) : (
            <div style={{ color: "#6b7280" }}>No answer available.</div>
          )}

          {qna.articlesourceurl && qna.articlesourceurl.trim() !== "" && (
            <div style={{ marginTop: "10px" }}>
              <a
                href={qna.articlesourceurl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(37, 99, 235, 0.25)",
                  backgroundColor: "rgba(37, 99, 235, 0.06)",
                  wordBreak: "break-all",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(37, 99, 235, 0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(37, 99, 235, 0.06)";
                }}
              >
                🔗 View source article
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            backgroundColor: "#ffffff",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.12)",
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.92";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
