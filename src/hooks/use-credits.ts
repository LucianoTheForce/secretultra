"use client";

import { useCallback, useEffect, useState } from "react";

type CreditsResponse = {
  credits: number;
  totalGenerated: number;
  isAdmin: boolean;
};

export function useCredits() {
  const [data, setData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      if (res.status === 401) {
        setData(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = (await res.json()) as CreditsResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    data,
    loading,
    error,
    refetch: fetchCredits,
  };
}
