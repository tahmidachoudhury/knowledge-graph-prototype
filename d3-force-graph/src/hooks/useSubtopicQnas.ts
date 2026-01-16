// src/hooks/useSubtopicQnas.ts

import { useEffect, useState } from "react";
import { fetchSubtopicQnas } from "../lib/graphData";
import type { SubtopicQnaData } from "../lib/types/graph.types";

export function useSubtopicQnas(subtopicId: string) {
  const [data, setData] = useState<SubtopicQnaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await fetchSubtopicQnas(subtopicId, abort.signal);
        setData(d);
      } catch (e: unknown) {
        if (
          e &&
          typeof e === "object" &&
          "name" in e &&
          (e as any).name === "AbortError"
        )
          return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();

    return () => abort.abort();
  }, [subtopicId]);

  return { data, loading, error };
}
