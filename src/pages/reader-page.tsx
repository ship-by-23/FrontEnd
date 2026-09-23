import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArticleTags } from "../components/reading/article-tags";
import { ErrorState, LoadingState } from "../components/feedback/states";
import { ReadingProgress } from "../components/reading/reading-progress";
import { apiRequest } from "../lib/api/client";
import type { Article } from "../lib/api/types";
import { useTheme } from "../features/theme/theme-context";
import { normalizeProgress, saveLocalReadingProgress, useLocalReadingProgress } from "../lib/reading-progress";
import { cn, formatDate } from "../lib/utils";

type ArticleResponse = Article | { data: Article };

export function ReaderPage() {
  const { articleId = "" } = useParams();
  const { theme } = useTheme();
  const localProgress = useLocalReadingProgress();
  const query = useQuery({ queryKey: ["article", articleId], queryFn: ({ signal }) => apiRequest<ArticleResponse>(`/articles/${articleId}`, { signal }), refetchInterval: (state) => { const raw = state.state.data; const article = raw && ("data" in raw ? raw.data : raw); return article?.extractionStatus === "pending" || article?.extractionStatus === "processing" ? 2500 : false; } });

  // Menyimpan progress lokal saat pengguna benar-benar menggulir artikel.
  useEffect(() => {
    if (!articleId || query.isPending || query.isError) return;
    let frame = 0;
    let lastPercent = -1;
    const syncProgress = () => {
      frame = 0;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollableHeight <= 0 ? 100 : (window.scrollY / scrollableHeight) * 100;
      const rounded = Math.max(0, Math.min(100, Math.round(percent)));
      if (rounded !== lastPercent) {
        lastPercent = rounded;
        saveLocalReadingProgress(articleId, rounded);
      }
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(syncProgress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [articleId, query.isError, query.isPending]);

  if (query.isPending) return <LoadingState label="Membuka artikel…" />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : "Artikel tidak dapat dibuka."} onRetry={() => void query.refetch()} />;
  const article = "data" in query.data ? query.data.data : query.data;
  if (article.extractionStatus === "pending" || article.extractionStatus === "processing") return <div className="mx-auto max-w-2xl"><Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Library</Link><LoadingState label="Artikel sedang dibersihkan. Halaman ini akan diperbarui otomatis…" /></div>;
  if (article.extractionStatus === "failed") return <div className="mx-auto max-w-2xl"><ErrorState title="Ekstraksi artikel gagal" message={article.extractionErrorCode ? `Kode kegagalan: ${article.extractionErrorCode}` : "Konten artikel belum berhasil diambil."} /></div>;

  const savedProgress = localProgress[articleId];
  const percent = savedProgress?.percent ?? normalizeProgress(article.readingProgress, article.readingStatus);
  const status = savedProgress?.status ?? article.readingStatus;
  const dark = theme === "dark";

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-[var(--reader-surface)] p-4 text-[var(--text)] transition-colors sm:-m-6 sm:p-8 lg:-m-10 lg:p-12">
      <div className="mx-auto max-w-3xl">
        <div className="sticky top-0 z-10 -mx-2 bg-[var(--reader-surface)] px-2 pb-4 pt-1 sm:-mx-4 sm:px-4"><div className="flex items-center justify-between gap-4"><Link to="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Library</Link><span className="text-xs text-[var(--text-muted)]">{percent}% · {status === "finished" ? "Selesai" : status === "reading" ? "Sedang dibaca" : "Belum dibaca"}</span></div><ReadingProgress percent={percent} status={status} showLabel={false} /></div>
        <header className="border-b border-current/25 py-12"><p className="text-sm opacity-70">{article.siteName ?? "Artikel"} · {formatDate(article.publishedAt ?? article.createdAt)}</p><h1 className="font-editorial mt-4 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">{article.title}</h1>{article.description ? <p className="mt-6 text-lg leading-8 opacity-75">{article.description}</p> : null}<div className="mt-6 flex flex-wrap gap-4 text-sm opacity-70">{article.author ? <span>{article.author}</span> : null}{article.estimatedReadingMinutes ? <span>{article.estimatedReadingMinutes} menit baca</span> : null}{article.canonicalUrl || article.submittedUrl ? <a className="inline-flex items-center gap-1 underline" href={article.canonicalUrl ?? article.submittedUrl} target="_blank" rel="noreferrer">Sumber asli <ExternalLink className="size-3" /></a> : null}</div></header>
        <ArticleTags articleId={article.id} serverTags={article.tags} />
        {article.contentHtml ? <article className={cn("prose prose-lg mt-10 max-w-none font-serif leading-8", dark && "prose-invert")} dangerouslySetInnerHTML={{ __html: article.contentHtml }} /> : <p className="py-12 opacity-70">Konten bersih belum tersedia.</p>}
      </div>
    </div>
  );
}
