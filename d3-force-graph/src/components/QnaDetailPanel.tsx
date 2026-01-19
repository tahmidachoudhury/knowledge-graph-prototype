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

    return () => window.removeEventListener("keydown", onKeyDown);
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
        zIndex: 50,
        display: "flex",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          marginLeft: "auto",
          height: "100%",
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "#ffffff",
          padding: "20px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {qna.question}
          </h2>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close question details"
            style={{
              border: "none",
              background: "transparent",
              padding: "4px 10px",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "6px",
              cursor: "pointer",
              color: "black"
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            fontSize: "14px",
            color: "#1f2937",
          }}
        >
          {qna.paragraph && (
            <p
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                color: "#374151",
              }}
            >
              {qna.paragraph}
            </p>
          )}

          {qna.answer ? (
            <div>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Answer
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{qna.answer}</div>
            </div>
          ) : (
            <div style={{ color: "#6b7280" }}>No answer available.</div>
          )}

          {qna.articlesourceurl && (
            <a
              href={qna.articlesourceurl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "#2563eb",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
            >
              View source article
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
