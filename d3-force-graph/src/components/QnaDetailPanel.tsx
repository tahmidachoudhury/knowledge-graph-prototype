// src/components/QnaDetailPanel.tsx

import { useEffect, useRef } from "react";
import type { QnaNode } from "../lib/types/graph.types";

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
    // focus close button when opened
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [qna, onClose]);

  if (!qna) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Question details"
      className="fixed inset-0 z-50 flex"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* panel */}
      <div
        className="relative ml-auto h-full w-full max-w-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold leading-snug">{qna.question}</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="rounded px-3 py-1 text-sm font-medium hover:bg-black/5"
            aria-label="Close question details"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-800">
          {qna.metadata?.difficulty && (
            <div>
              <span className="font-medium">Difficulty:</span>{" "}
              <span>{qna.metadata.difficulty}</span>
            </div>
          )}

          {qna.answer ? (
            <div>
              <div className="font-medium mb-1">Answer</div>
              <div className="whitespace-pre-wrap">{qna.answer}</div>
            </div>
          ) : (
            <div className="text-gray-500">No answer available.</div>
          )}

          {/* dump extra metadata if you want */}
          {/* <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(qna, null, 2)}</pre> */}
        </div>
      </div>
    </div>
  );
}
