import { useQuery } from "@tanstack/react-query";
import { BookOpen, Grid2X2, Heart, List, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/form-controls";
import { apiRequest } from "../lib/api/client";
import type { ArticleCollection, ArticleSummary, ReadingStatus } from "../lib/api/types";
import { cn, formatDate } from "../lib/utils";

function ArticleCard({ article, compact }: { article: ArticleSummary; compact: boolean }) {
  const pending = article.extractionStatus === "pending" || article.extractionStatus === "processing";
  return (
    <article className={cn("group border border-[var(--border)] bg-[var(--surface)]", compact ? "grid gap-4 p-5 sm:grid-cols-[1fr_auto]" : "flex min-h-72 flex-col p-6")}>
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{article.siteName ?? "Sumber artikel"}</span><span aria-hidden="true">•</span><span>{formatDate(article.createdAt)}</span>
        </div>
        <h2 className="font-editorial text-2xl font-semibold leading-tight"><Link className="decoration-1 underline-offset-4 group-hover:underline" to={`/articles/${article.id}`}>{article.title ?? "Artikel sedang diproses"}</Link></h2>
        {article.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}
      </div>
      <div className={cn("mt-auto flex flex-wrap items-center gap-3 pt-6 text-xs", compact && "sm:mt-0 sm:flex-col sm:items-end sm:pt-0")}>
        <span className="border border-[var(--border-muted)] px-2 py-1">{pending ? "Sedang diekstrak" : article.extractionStatus === "failed" ? "Ekstraksi gagal" : article.readingStatus === "finished" ? "Selesai" : article.readingStatus === "reading" ? "Sedang dibaca" : "Belum dibaca"}</span>
        {article.isFavorite ? <span className="inline-flex items-center gap-1"><Heart className="size-3 fill-current" aria-hidden="true" /> Favorit</span> : null}
        {article.estimatedReadingMinutes ? <span>{article.estimatedReadingMinutes} menit</span> : null}
      </div>
    </article>
  );
}

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const view = searchParams.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const query = useQuery({
    queryKey: ["articles", { status, page }],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (status !== "all") params.set("status", status);
      return apiRequest<ArticleCollection>(`/articles?${params}`, { signal });
    },
  });

  // Menyimpan filter dan mode tampilan pada URL agar dapat dibagikan dan dipulihkan.
  function updateParam(name: string, value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set(name, value);
      if (name === "status") next.delete("page");
      return next;
    });
  }

  return (
    <div>
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pustaka pribadi</p><h1 className="font-editorial mt-1 text-5xl font-semibold">Library</h1></div>
        <Link to="/articles/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white"><Plus className="size-4" aria-hidden="true" />Simpan artikel</Link>
      </header>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">Status <Select value={status} onChange={(event) => updateParam("status", event.target.value)}><option value="all">Semua</option>{(["unread", "reading", "finished"] satisfies ReadingStatus[]).map((value) => <option key={value} value={value}>{value === "unread" ? "Belum dibaca" : value === "reading" ? "Sedang dibaca" : "Selesai"}</option>)}</Select></label>
        <div className="flex border border-[var(--border)]" aria-label="Mode tampilan"><Button className="rounded-none border-0 px-3" variant={view === "grid" ? "primary" : "ghost"} aria-label="Tampilan grid" aria-pressed={view === "grid"} onClick={() => updateParam("view", "grid")}><Grid2X2 className="size-4" /></Button><Button className="rounded-none border-0 px-3" variant={view === "list" ? "primary" : "ghost"} aria-label="Tampilan list" aria-pressed={view === "list"} onClick={() => updateParam("view", "list")}><List className="size-4" /></Button></div>
      </div>
      {query.isPending ? <LoadingState label="Memuat pustaka…" /> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Pustaka tidak dapat dimuat."} onRetry={() => void query.refetch()} /> : query.data.data.length === 0 ? <EmptyState title="Pustakamu masih kosong" description="Simpan artikel pertama untuk mulai membangun ruang baca pribadimu." action={<Link to="/articles/new" className="inline-flex min-h-11 items-center gap-2 border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white"><BookOpen className="size-4" />Simpan artikel pertama</Link>} /> : (
        <><div className={cn("grid gap-4", view === "grid" && "md:grid-cols-2 xl:grid-cols-3")}>{query.data.data.map((article) => <ArticleCard key={article.id} article={article} compact={view === "list"} />)}</div>
        {query.data.pagination.totalPages > 1 ? <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))}>Sebelumnya</Button><span className="text-sm">Halaman {page} dari {query.data.pagination.totalPages}</span><Button variant="secondary" disabled={page >= query.data.pagination.totalPages} onClick={() => updateParam("page", String(page + 1))}>Berikutnya</Button></nav> : null}</>
      )}
    </div>
  );
}
