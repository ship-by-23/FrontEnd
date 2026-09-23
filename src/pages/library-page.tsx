import { useQuery } from "@tanstack/react-query";
import { BookOpen, Grid2X2, Heart, List, Plus } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { ReadingProgress } from "../components/reading/reading-progress";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/form-controls";
import { apiRequest } from "../lib/api/client";
import type { ArticleCollection, ArticleSummary, ReadingStatus } from "../lib/api/types";
import { getLocalTagsForArticle, useLocalTags } from "../lib/local-tags";
import { getReadingStatus, normalizeProgress, readingStatusLabel, useLocalReadingProgress } from "../lib/reading-progress";
import { cn, formatDate } from "../lib/utils";

function getEffectiveStatus(article: ArticleSummary, localProgress?: ReturnType<typeof useLocalReadingProgress>[string]) {
  return localProgress?.status ?? article.readingStatus ?? getReadingStatus(normalizeProgress(article.readingProgress));
}

async function fetchArticles({
  signal,
  page,
  tagId,
  loadAll,
}: {
  signal: AbortSignal;
  page: number;
  tagId?: string;
  loadAll: boolean;
}) {
  const pageSize = 20;
  const baseParams = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (tagId) baseParams.set("tagId", tagId);
  const firstPage = await apiRequest<ArticleCollection>(`/articles?${baseParams}`, { signal });

  // Status, favorit, dan tag perangkat bisa berubah di browser tanpa mengubah API.
  // Saat filter lokal aktif, ambil seluruh halaman API agar artikel yang cocok tidak
  // hilang hanya karena kebetulan berada di halaman pagination berikutnya.
  if (!loadAll || firstPage.pagination.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) => {
      const params = new URLSearchParams({ page: String(index + 2), pageSize: String(pageSize) });
      if (tagId) params.set("tagId", tagId);
      return apiRequest<ArticleCollection>(`/articles?${params}`, { signal });
    }),
  );
  const data = [firstPage, ...remainingPages].flatMap((collection) => collection.data);
  return {
    data,
    pagination: { ...firstPage.pagination, page: 1, pageSize: data.length, totalItems: data.length, totalPages: 1 },
  } satisfies ArticleCollection;
}

function ArticleCard({ article, compact, localTags, localProgress }: { article: ArticleSummary; compact: boolean; localTags: ReturnType<typeof useLocalTags>; localProgress: ReturnType<typeof useLocalReadingProgress> }) {
  const pending = article.extractionStatus === "pending" || article.extractionStatus === "processing";
  const localArticleProgress = localProgress[article.id];
  const percent = localArticleProgress?.percent ?? normalizeProgress(article.readingProgress, article.readingStatus);
  const status = getEffectiveStatus(article, localArticleProgress);
  const tags = Array.from(new Set([...(article.tags ?? []).map((tag) => tag.name), ...getLocalTagsForArticle(localTags, article.id).map((tag) => tag.name)]));
  return (
    <article className={cn("group border border-[var(--border)] bg-[var(--surface)]", compact ? "grid gap-4 p-5 sm:grid-cols-[1fr_auto]" : "flex min-h-72 flex-col p-6")}>
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{article.siteName ?? "Sumber artikel"}</span><span aria-hidden="true">•</span><span>{formatDate(article.createdAt)}</span>
        </div>
        <h2 className="font-editorial text-2xl font-semibold leading-tight"><Link className="decoration-1 underline-offset-4 group-hover:underline" to={`/articles/${article.id}`}>{article.title ?? "Artikel sedang diproses"}</Link></h2>
        {article.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}
        {tags.length > 0 ? <div className="mt-4 flex flex-wrap gap-1.5">{tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full border border-[var(--border-muted)] px-2 py-1 text-[10px] font-semibold">{tag}</span>)}</div> : null}
      </div>
      <div className={cn("mt-auto pt-6", compact && "sm:mt-0 sm:pt-0")}>
        {pending || article.extractionStatus === "failed" ? <span className="inline-flex border border-[var(--border-muted)] px-2 py-1 text-xs">{pending ? "Sedang diekstrak" : "Ekstraksi gagal"}</span> : <ReadingProgress percent={percent} status={status} compact />}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {article.isFavorite ? <span className="inline-flex items-center gap-1"><Heart className="size-3 fill-current" aria-hidden="true" /> Favorit</span> : null}
        {article.estimatedReadingMinutes ? <span>{article.estimatedReadingMinutes} menit</span> : null}
        </div>
      </div>
    </article>
  );
}

export function LibraryPage() {
  const { tagId } = useParams<{ tagId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const view = searchParams.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const localTagId = searchParams.get("localTag");
  const favoriteOnly = searchParams.get("favorite") === "1";
  const localTags = useLocalTags();
  const localProgress = useLocalReadingProgress();
  const loadAllForLocalFilter = status !== "all" || favoriteOnly || Boolean(localTagId);

  const query = useQuery({
    queryKey: ["articles", { status, page, tagId, localTagId, favoriteOnly }],
    queryFn: ({ signal }) => fetchArticles({ signal, page, tagId, loadAll: loadAllForLocalFilter }),
  });
  const articles = query.data?.data ?? [];
  const visibleArticles = articles.filter((article) => {
    const matchesStatus = status === "all" || getEffectiveStatus(article, localProgress[article.id]) === status;
    const matchesLocalTag = !localTagId || getLocalTagsForArticle(localTags, article.id).some((tag) => tag.id === localTagId);
    const matchesFavorite = !favoriteOnly || article.isFavorite;
    return matchesStatus && matchesLocalTag && matchesFavorite;
  });

  // Menyimpan filter dan mode tampilan pada URL agar dapat dibagikan dan dipulihkan.
  function updateParam(name: string, value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set(name, value);
      if (name === "status" || name === "favorite" || name === "localTag") next.delete("page");
      return next;
    });
  }

  const emptyTitle = localTagId
    ? "Belum ada artikel dengan tag ini"
    : favoriteOnly
      ? "Belum ada buku favorit"
      : status !== "all"
        ? `Belum ada artikel ${readingStatusLabel(status as ReadingStatus).toLocaleLowerCase("id-ID")}`
        : "Pustakamu masih kosong";
  const emptyDescription = localTagId
    ? "Tambahkan tag ini dari halaman reader artikel."
    : favoriteOnly
      ? "Artikel yang ditandai favorit dari akun akan tampil di sini."
      : status !== "all"
        ? "Progress pada card dan filter status sekarang menggunakan status efektif yang terlihat di frontend."
        : "Simpan artikel pertama untuk mulai membangun ruang baca pribadimu.";

  return (
    <div>
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pustaka pribadi</p><h1 className="font-editorial mt-1 text-5xl font-semibold">Library</h1></div>
        <Link to="/articles/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-[var(--surface)]"><Plus className="size-4" aria-hidden="true" />Simpan artikel</Link>
      </header>
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">Status <Select value={status} onChange={(event) => updateParam("status", event.target.value)}><option value="all">Semua</option>{(["unread", "reading", "finished"] satisfies ReadingStatus[]).map((value) => <option key={value} value={value}>{value === "unread" ? "Belum dibaca" : value === "reading" ? "Sedang dibaca" : "Selesai"}</option>)}</Select></label>
        <div className="flex border border-[var(--border)]" aria-label="Mode tampilan"><Button className="rounded-none border-0 px-3" variant={view === "grid" ? "primary" : "ghost"} aria-label="Tampilan grid" aria-pressed={view === "grid"} onClick={() => updateParam("view", "grid")}><Grid2X2 className="size-4" /></Button><Button className="rounded-none border-0 px-3" variant={view === "list" ? "primary" : "ghost"} aria-label="Tampilan list" aria-pressed={view === "list"} onClick={() => updateParam("view", "list")}><List className="size-4" /></Button></div>
      </div>
      {query.isPending ? <LoadingState label="Memuat pustaka…" /> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Pustaka tidak dapat dimuat."} onRetry={() => void query.refetch()} /> : visibleArticles.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} action={!localTagId && !favoriteOnly && status === "all" ? <Link to="/articles/new" className="inline-flex min-h-11 items-center gap-2 border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-[var(--surface)]"><BookOpen className="size-4" />Simpan artikel pertama</Link> : undefined} /> : (
        <><div className={cn("grid gap-4", view === "grid" && "md:grid-cols-2 xl:grid-cols-3")}>{visibleArticles.map((article) => <ArticleCard key={article.id} article={article} compact={view === "list"} localTags={localTags} localProgress={localProgress} />)}</div>
        {!localTagId && query.data.pagination.totalPages > 1 ? <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))}>Sebelumnya</Button><span className="text-sm">Halaman {page} dari {query.data.pagination.totalPages}</span><Button variant="secondary" disabled={page >= query.data.pagination.totalPages} onClick={() => updateParam("page", String(page + 1))}>Berikutnya</Button></nav> : null}</>
      )}
    </div>
  );
}
