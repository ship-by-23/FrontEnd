import { ArrowLeft, Check, ExternalLink, Moon, Pencil, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useMemo, type RefObject } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState } from "../../components/feedback/states";
import { Button } from "../../components/ui/button";
import type { Article, Highlight } from "../../lib/api/types";
import { cn, formatDate } from "../../lib/utils";
import { READER_FONT_CLASSES, READER_TEXT_SIZE_CLASSES, type ReaderFont, type ReaderTextSize } from "../appearance/appearance-utils";
import { applyHighlightMarks, clearHighlightMarks } from "../highlights/highlight-dom-utils";
import { sanitizeArticleHtml } from "./article-html-sanitizer";
import { getSafeReaderSourceUrl, type ReaderTheme } from "./reader-utils";

type ReaderHeaderProps = {
  articleId: string;
  theme: ReaderTheme;
  dark: boolean;
  isFinished: boolean;
  isMarkingFinished: boolean;
  onThemeChange: (theme: ReaderTheme) => void;
  onMarkFinished: () => void;
};

// Menyediakan kontrol navigasi, preference theme, dan aksi selesai pada shell Reader.
export function ReaderHeader({
  articleId,
  theme,
  dark,
  isFinished,
  isMarkingFinished,
  onThemeChange,
  onMarkFinished,
}: ReaderHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-current/20 pb-4">
      <Link to="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Library
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link to={`/articles/${articleId}/edit`} className="inline-flex min-h-11 items-center gap-2 border border-current/25 px-3 text-sm font-semibold hover:bg-current/5">
          <Pencil className="size-4" aria-hidden="true" />
          Edit metadata
        </Link>
        <ReaderPreferencesPopover theme={theme} onThemeChange={onThemeChange} />
        <MarkFinishedButton dark={dark} isFinished={isFinished} isPending={isMarkingFinished} onClick={onMarkFinished} />
      </div>
    </header>
  );
}

type ReaderPreferencesPopoverProps = {
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
};

// Menyediakan preference theme light/dark tanpa mengganti route Reader.
export function ReaderPreferencesPopover({ theme, onThemeChange }: ReaderPreferencesPopoverProps) {
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 border border-current/25 px-3 text-sm font-semibold hover:bg-current/5 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Tampilan
      </summary>
      <div className={cn(
        "absolute right-0 z-30 mt-2 w-56 border border-current/25 p-4 shadow-[0.35rem_0.35rem_0_var(--accent)]",
        theme === "dark" ? "bg-[var(--reader-dark-surface)] text-[var(--reader-dark-text)]" : "bg-[var(--surface)] text-[var(--text)]",
      )}>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Tema Reader</legend>
          <div className="mt-3 grid gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-[var(--border-muted)] px-3 text-sm hover:bg-[var(--surface-muted)]">
              <input
                type="radio"
                name="reader-theme"
                value="light"
                checked={theme === "light"}
                onChange={() => onThemeChange("light")}
              />
              <Sun className="size-4" aria-hidden="true" />
              Terang
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-[var(--border-muted)] px-3 text-sm hover:bg-[var(--surface-muted)]">
              <input
                type="radio"
                name="reader-theme"
                value="dark"
                checked={theme === "dark"}
                onChange={() => onThemeChange("dark")}
              />
              <Moon className="size-4" aria-hidden="true" />
              Gelap
            </label>
          </div>
        </fieldset>
      </div>
    </details>
  );
}

type MarkFinishedButtonProps = {
  dark: boolean;
  isFinished: boolean;
  isPending: boolean;
  onClick: () => void;
};

// Mengirim aksi selesai hanya sekali dan mempertahankan feedback yang dapat dipahami keyboard user.
export function MarkFinishedButton({ dark, isFinished, isPending, onClick }: MarkFinishedButtonProps) {
  return (
    <Button
      variant={isFinished || dark ? "secondary" : "primary"}
      disabled={isFinished || isPending}
      onClick={onClick}
      aria-label={isFinished ? "Artikel sudah selesai dibaca" : "Tandai artikel selesai dibaca"}
    >
      <Check className="size-4" aria-hidden="true" />
      {isFinished ? "Sudah selesai" : isPending ? "Menyimpan…" : "Tandai selesai"}
    </Button>
  );
}

// Menampilkan metadata artikel nyata tanpa membuat judul atau angka pengganti dari frontend.
export function ArticleMetadata({ article }: { article: Article }) {
  const title = article.title ?? "Artikel tanpa judul";
  const sourceUrl = getSafeReaderSourceUrl(article.canonicalUrl ?? article.submittedUrl);

  return (
    <header className="border-b border-current/20 py-10 sm:py-14">
      <p className="text-sm opacity-70">
        {article.siteName ?? "Artikel"} · {formatDate(article.publishedAt ?? article.createdAt)}
      </p>
      <h1 className="font-editorial mt-4 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">{title}</h1>
      {article.description ? <p className="mt-6 max-w-2xl text-lg leading-8 opacity-75">{article.description}</p> : null}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm opacity-75">
        {article.author ? <span>{article.author}</span> : null}
        {article.estimatedReadingMinutes ? <span>{article.estimatedReadingMinutes} menit baca</span> : null}
        <span>{article.readingStatus === "finished" ? "Selesai" : article.readingStatus === "reading" ? "Sedang dibaca" : "Belum dibaca"}</span>
        {sourceUrl ? <SourceLink href={sourceUrl} /> : null}
      </div>
    </header>
  );
}

// Membuka sumber asli pada tab baru dengan relasi window yang aman.
export function SourceLink({ href }: { href: string }) {
  return (
    <a className="inline-flex items-center gap-1 underline underline-offset-4" href={href} target="_blank" rel="noopener noreferrer">
      Sumber asli
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

type ReaderBodyProps = {
  contentHtml: string | null | undefined;
  dark: boolean;
  readerFont: ReaderFont;
  textSize: ReaderTextSize;
  bodyRef: RefObject<HTMLElement | null>;
  highlights?: Highlight[];
  onHighlightClick?: (highlightId: string) => void;
};

// Merender hanya HTML yang dijamin sudah disanitasi oleh backend pada contract artikel.
export function ReaderBody({ contentHtml, dark, readerFont, textSize, bodyRef, highlights = [], onHighlightClick }: ReaderBodyProps) {
  const sanitizedContentHtml = useMemo(() => sanitizeArticleHtml(contentHtml), [contentHtml]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !sanitizedContentHtml) return;
    applyHighlightMarks(body, highlights);
    return () => clearHighlightMarks(body);
  }, [bodyRef, highlights, sanitizedContentHtml]);

  // Membuka editor note ketika user mengklik mark yang sudah tersimpan di Reader.
  function handleBodyClick(event: React.MouseEvent<HTMLElement>) {
    if (!onHighlightClick) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const mark = target.closest<HTMLElement>("mark[data-highlight-id]");
    const highlightId = mark?.dataset.highlightId;
    if (highlightId) onHighlightClick(highlightId);
  }

  if (!sanitizedContentHtml) {
    return <EmptyState title="Konten belum tersedia" description="Artikel sudah tercatat, tetapi konten bersih belum tersedia untuk dibaca." />;
  }

  return (
    <article
      ref={bodyRef}
      onClick={handleBodyClick}
      className={cn("prose mt-10 max-w-none leading-8", READER_FONT_CLASSES[readerFont], READER_TEXT_SIZE_CLASSES[textSize], dark && "prose-invert")}
      dangerouslySetInnerHTML={{ __html: sanitizedContentHtml }}
    />
  );
}

// Menampilkan progress visual dengan aria value tanpa mengaitkannya pada fake extraction progress.
export function ReadingProgressBar({ progress, dark }: { progress: number; dark: boolean }) {
  return (
    <div
      className="sticky top-0 z-10 -mx-4 h-1 bg-current/15 sm:-mx-8 lg:-mx-12"
      role="progressbar"
      aria-label="Progress membaca"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className={cn("h-full transition-[width] duration-150", dark ? "bg-[var(--reader-dark-text)]" : "bg-[var(--success)]")}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Menjaga struktur Reader tetap stabil selama detail artikel sedang dimuat.
export function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse" aria-label="Memuat artikel" role="status">
      <div className="h-5 w-24 bg-[var(--surface-muted)]" />
      <div className="mt-8 h-16 max-w-2xl bg-[var(--surface-muted)]" />
      <div className="mt-5 h-5 max-w-xl bg-[var(--surface-muted)]" />
      <div className="mt-12 grid gap-4">
        <div className="h-5 bg-[var(--surface-muted)]" />
        <div className="h-5 bg-[var(--surface-muted)]" />
        <div className="h-5 max-w-4xl bg-[var(--surface-muted)]" />
        <div className="mt-4 h-40 bg-[var(--surface-muted)]" />
      </div>
      <span className="sr-only">Membuka artikel…</span>
    </div>
  );
}

// Menampilkan error Reader dengan retry yang aman dan jalan kembali ke library.
export function ReaderErrorState({ title = "Artikel tidak dapat dibuka", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <ErrorState title={title} message={message} onRetry={onRetry} />
      <Link to="/library" className="mt-4 inline-flex min-h-11 items-center border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
        Kembali ke library
      </Link>
    </div>
  );
}

// Menampilkan status penyimpanan progress tanpa mengganggu pembacaan artikel.
export function ProgressSaveStatus({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  return (
    <span className={cn("text-xs", state === "error" ? "text-[var(--danger)]" : "opacity-70")} role="status" aria-live="polite">
      {state === "saving" ? "Menyimpan posisi…" : state === "saved" ? "Posisi tersimpan" : "Posisi belum tersimpan"}
    </span>
  );
}
