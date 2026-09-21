import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/api/client";
import type { Article } from "../lib/api/types";
import { cn, formatDate } from "../lib/utils";

type ArticleResponse = Article | { data: Article };

export function ReaderPage() {
  const { articleId = "" } = useParams();
  const [dark, setDark] = useState(() => localStorage.getItem("reader-theme") === "dark");
  const query = useQuery({ queryKey: ["article", articleId], queryFn: ({ signal }) => apiRequest<ArticleResponse>(`/articles/${articleId}`, { signal }), refetchInterval: (state) => { const raw = state.state.data; const article = raw && ("data" in raw ? raw.data : raw); return article?.extractionStatus === "pending" || article?.extractionStatus === "processing" ? 2500 : false; } });

  // Mengubah tema reader yang sama tanpa membuat route atau artikel baru.
  function toggleTheme() {
    setDark((current) => {
      localStorage.setItem("reader-theme", current ? "light" : "dark");
      return !current;
    });
  }

  if (query.isPending) return <LoadingState label="Membuka artikel…" />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : "Artikel tidak dapat dibuka."} onRetry={() => void query.refetch()} />;
  const article = "data" in query.data ? query.data.data : query.data;
  if (article.extractionStatus === "pending" || article.extractionStatus === "processing") return <div className="mx-auto max-w-2xl"><Link to="/library" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Library</Link><LoadingState label="Artikel sedang dibersihkan. Halaman ini akan diperbarui otomatis…" /></div>;
  if (article.extractionStatus === "failed") return <div className="mx-auto max-w-2xl"><ErrorState title="Ekstraksi artikel gagal" message={article.extractionErrorCode ? `Kode kegagalan: ${article.extractionErrorCode}` : "Konten artikel belum berhasil diambil."} /></div>;

  return (
    <div className={cn("-m-4 min-h-[calc(100vh-4rem)] p-4 transition-colors sm:-m-6 sm:p-8 lg:-m-10 lg:p-12", dark ? "bg-[var(--reader-dark)] text-[var(--reader-dark-text)]" : "bg-[var(--surface)] text-[var(--text)]")}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4"><Link to="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Library</Link><Button variant={dark ? "secondary" : "ghost"} onClick={toggleTheme} aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button></div>
        <header className="border-b border-current/25 py-12"><p className="text-sm opacity-70">{article.siteName ?? "Artikel"} · {formatDate(article.publishedAt ?? article.createdAt)}</p><h1 className="font-editorial mt-4 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">{article.title}</h1>{article.description ? <p className="mt-6 text-lg leading-8 opacity-75">{article.description}</p> : null}<div className="mt-6 flex flex-wrap gap-4 text-sm opacity-70">{article.author ? <span>{article.author}</span> : null}{article.estimatedReadingMinutes ? <span>{article.estimatedReadingMinutes} menit baca</span> : null}{article.canonicalUrl || article.submittedUrl ? <a className="inline-flex items-center gap-1 underline" href={article.canonicalUrl ?? article.submittedUrl} target="_blank" rel="noreferrer">Sumber asli <ExternalLink className="size-3" /></a> : null}</div></header>
        {article.contentHtml ? <article className={cn("prose prose-lg mt-10 max-w-none font-serif leading-8", dark && "prose-invert")} dangerouslySetInnerHTML={{ __html: article.contentHtml }} /> : <p className="py-12 opacity-70">Konten bersih belum tersedia.</p>}
      </div>
    </div>
  );
}
