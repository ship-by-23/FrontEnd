import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Input } from "../components/ui/form-controls";
import { apiRequest } from "../lib/api/client";
import type { ArticleCollection } from "../lib/api/types";

function useDebouncedValue(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const queryText = urlQuery.trim();
  const debouncedQuery = useDebouncedValue(queryText);
  const isWaitingForDebounce = queryText.length > 0 && queryText !== debouncedQuery;
  const result = useQuery({ queryKey: ["article-search", debouncedQuery], queryFn: ({ signal }) => apiRequest<ArticleCollection>(`/articles?${new URLSearchParams({ query: debouncedQuery, page: "1", pageSize: "20" })}`, { signal }), enabled: debouncedQuery.length > 0 });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Temukan kembali</p><h1 className="font-editorial mt-1 text-5xl font-semibold">Pencarian</h1>
      <label className="relative mt-8 block"><span className="sr-only">Cari artikel</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" /><Input className="min-h-14 pl-12 text-lg" type="search" placeholder="Cari judul, deskripsi, atau isi…" value={urlQuery} onChange={(event) => { const value = event.target.value; const next = new URLSearchParams(params); if (value) next.set("q", value); else next.delete("q"); setParams(next, { replace: true }); }} /></label>
      <div className="mt-3 min-h-5 text-xs text-[var(--text-muted)]" aria-live="polite">{isWaitingForDebounce || result.isFetching ? "Memperbarui hasil…" : debouncedQuery ? `Hasil untuk “${debouncedQuery}”` : null}</div>
      <div className="mt-3">{!queryText ? <EmptyState title="Cari di seluruh pustaka" description="Masukkan kata atau gagasan yang ingin kamu temukan kembali." /> : !debouncedQuery || (result.isPending && !result.data) ? <LoadingState label="Mencari artikel…" /> : result.isError ? <ErrorState message={result.error instanceof Error ? result.error.message : "Pencarian gagal."} onRetry={() => void result.refetch()} /> : result.data.data.length === 0 ? <EmptyState title="Tidak ada hasil" description={`Tidak ada artikel yang cocok dengan “${queryText}”.`} /> : <div className="divide-y divide-[var(--border-muted)] border-y border-[var(--border)]">{result.data.data.map((article) => <article key={article.id} className="py-6"><p className="text-xs text-[var(--text-muted)]">{article.siteName ?? "Artikel"}</p><h2 className="font-editorial mt-1 text-2xl font-semibold"><Link className="hover:underline" to={`/articles/${article.id}`}>{article.title ?? "Tanpa judul"}</Link></h2>{article.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}</article>)}</div>}</div>
    </div>
  );
}
