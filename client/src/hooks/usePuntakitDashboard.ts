import { useEffect, useState } from "react";
import { getDashboardSnapshot, searchChurchContent } from "../services/puntakitService";
import type { DashboardSnapshot } from "../types/puntakit";

export function usePuntakitDashboard() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ type: string; title: string; meta: string; href: string }>>([]);

  useEffect(() => { getDashboardSnapshot().then(setData).finally(() => setLoading(false)); }, []);
  useEffect(() => { let cancelled = false; const timer = window.setTimeout(() => { searchChurchContent(query).then((items) => { if (!cancelled) setResults(items); }); }, 120); return () => { cancelled = true; window.clearTimeout(timer); }; }, [query]);
  return { data, loading, query, setQuery, results };
}
