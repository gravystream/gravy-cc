"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SearchFilters {
  type?: "creators" | "campaigns";
  niche?: string[];
  platform?: string[];
  location?: string;
  minRating?: number;
  verified?: boolean;
  availability?: string;
  sort?: string;
}

interface SearchResult<T = any> {
  results: T[];
  total: number;
  page: number;
  totalPages: number;
}

export function useSearch<T = any>(defaultFilters: SearchFilters = {}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult<T>>({
    results: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(
    async (q: string, page: number = 1, currentFilters?: SearchFilters) => {
      const f = currentFilters || filters;

      // Abort previous request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        params.set("type", f.type || "creators");
        params.set("page", String(page));
        if (f.sort) params.set("sort", f.sort);
        if (f.location) params.set("location", f.location);
        if (f.minRating) params.set("minRating", String(f.minRating));
        if (f.verified) params.set("verified", "true");
        if (f.availability) params.set("availability", f.availability);
        f.niche?.forEach((n) => params.append("niche", n));
        f.platform?.forEach((p) => params.append("platform", p));

        const res = await fetch("/api/search?" + params.toString(), {
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Search failed");

        const data: SearchResult<T> = await res.json();
        setResults(data);
        return data;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const msg = err.message || "Search failed";
          setError(msg);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  // Debounced search on query change
  const debouncedSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(q), 300);
    },
    [search]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      search(query, 1, updated);
    },
    [filters, query, search]
  );

  const nextPage = useCallback(() => {
    if (results.page < results.totalPages) {
      search(query, results.page + 1);
    }
  }, [results, query, search]);

  const prevPage = useCallback(() => {
    if (results.page > 1) {
      search(query, results.page - 1);
    }
  }, [results, query, search]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    setQuery: debouncedSearch,
    filters,
    updateFilters,
    results: results.results,
    total: results.total,
    page: results.page,
    totalPages: results.totalPages,
    isLoading,
    error,
    search,
    nextPage,
    prevPage,
  };
}
