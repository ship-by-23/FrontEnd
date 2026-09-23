import { motion, useReducedMotion } from "motion/react";
import { Archive, ArchiveRestore, Heart, ImageOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/form-controls";
import type { ArticleSummary, ReadingStatus, Tag } from "../../lib/api/types";
import { cn, formatDate } from "../../lib/utils";
import type { ArticleUpdateInput } from "./library-api";
import type { ArticleTagAction } from "../tags/tags-api";
import { ArticleTagManager } from "../tags/tags-components";
import {
  getExtractionStatusLabel,
  getReadingStatusLabel,
} from "./library-utils";

type ArticleCardProps = {
  article: ArticleSummary;
  compact: boolean;
  actionPending: boolean;
  onUpdate: (articleId: string, input: ArticleUpdateInput) => void;
  onDelete: (article: ArticleSummary) => void;
  availableTags?: Tag[];
  tagsLoading?: boolean;
  tagsError?: unknown;
  onTagChange?: (input: ArticleTagAction) => Promise<unknown>;
};

type ArticleCollectionProps = Omit<ArticleCardProps, "article" | "compact"> & {
  articles: ArticleSummary[];
};

// Menampilkan placeholder stabil ketika thumbnail tidak tersedia atau gagal dimuat.
function ArticleThumbnail({ article, compact }: { article: ArticleSummary; compact: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  // Menyembunyikan gambar yang gagal agar layout kartu tetap valid tanpa URL pengganti palsu.
  function handleImageError() {
    setImageFailed(true);
  }

  if (!article.imageUrl || imageFailed) {
    return (
      <div className={cn("grid shrink-0 place-items-center border border-[var(--border-muted)] bg-[var(--surface-muted)] text-[var(--text-muted)]", compact ? "size-20" : "aspect-[16/8] w-full")} aria-hidden="true">
        <ImageOff className="size-5" />
      </div>
    );
  }

  return (
    <img
      src={article.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleImageError}
      className={cn("shrink-0 object-cover", compact ? "size-20" : "aspect-[16/8] w-full")}
    />
  );
}

// Menampilkan status ekstraksi atau status baca dengan teks agar state tidak bergantung pada warna saja.
function ReadingStatusBadge({ article }: { article: ArticleSummary }) {
  const extractionIncomplete = article.extractionStatus !== "completed";
  const label = extractionIncomplete
    ? getExtractionStatusLabel(article.extractionStatus)
    : getReadingStatusLabel(article.readingStatus);

  return (
    <span className={cn(
      "inline-flex min-h-7 items-center border px-2 py-1 text-xs font-semibold",
      article.extractionStatus === "failed" && "border-[var(--danger)] text-[var(--danger)]",
      article.extractionStatus === "pending" || article.extractionStatus === "processing" ? "border-[var(--warning)] text-[var(--warning)]" : "border-[var(--border-muted)]",
    )}>
      {label}
    </span>
  );
}

// Menampilkan progress baca hanya ketika backend menyediakan nilai nyata.
function ReadingProgress({ article }: { article: ArticleSummary }) {
  if (article.readingProgress === undefined || article.readingProgress === null) return null;

  const progress = Math.min(100, Math.max(0, Math.round(article.readingProgress)));
  return (
    <span className="text-xs text-[var(--text-muted)]" aria-label={"Progress baca " + progress + " persen"}>
      {progress}% dibaca
    </span>
  );
}

// Mengirim quick action status, favorite, archive, atau delete dari satu kartu artikel.
function ArticleActions({ article, actionPending, onUpdate, onDelete }: Omit<ArticleCardProps, "compact">) {
  // Mengirim status baca yang sudah dibatasi pada enum yang didukung backend.
  function handleStatusChange(value: string) {
    if (value !== "unread" && value !== "reading" && value !== "finished") return;
    onUpdate(article.id, { readingStatus: value as ReadingStatus });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={"Aksi untuk " + (article.title ?? "artikel tanpa judul")}>
      <label className="sr-only" htmlFor={"article-status-" + article.id}>Status baca</label>
      <Select
        id={"article-status-" + article.id}
        className="min-h-10 max-w-40 text-xs"
        value={article.readingStatus}
        disabled={actionPending}
        onChange={(event) => handleStatusChange(event.target.value)}
      >
        <option value="unread">Belum dibaca</option>
        <option value="reading">Sedang dibaca</option>
        <option value="finished">Selesai</option>
      </Select>
      <Button
        variant={article.isFavorite ? "secondary" : "ghost"}
        className="size-11 px-0"
        aria-label={article.isFavorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}
        aria-pressed={article.isFavorite}
        disabled={actionPending}
        onClick={() => onUpdate(article.id, { isFavorite: !article.isFavorite })}
      >
        <Heart className={cn("size-4", article.isFavorite && "fill-current")} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        className="size-11 px-0"
        aria-label={article.isArchived ? "Keluarkan dari arsip" : "Arsipkan artikel"}
        aria-pressed={article.isArchived}
        disabled={actionPending}
        onClick={() => onUpdate(article.id, { isArchived: !article.isArchived })}
      >
        {article.isArchived ? <ArchiveRestore className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
      </Button>
      <Link
        to={`/articles/${article.id}/edit`}
        className="inline-flex size-11 items-center justify-center rounded-[3px] border border-transparent text-[var(--text)] hover:bg-[var(--surface-muted)]"
        aria-label="Edit metadata artikel"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Link>
      <Button
        variant="ghost"
        className="size-11 px-0 text-[var(--danger)] hover:bg-[color:var(--danger)]/10"
        aria-label="Hapus artikel"
        disabled={actionPending}
        onClick={() => onDelete(article)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

// Merender satu artikel dalam mode grid atau list dengan data nyata dari API.
export function ArticleCard({ article, compact, actionPending, onUpdate, onDelete, availableTags = [], tagsLoading = false, tagsError, onTagChange }: ArticleCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const title = article.title ?? "Artikel tanpa judul";

  return (
    <motion.article
      layout={!shouldReduceMotion}
      className={cn(
        "group border border-[var(--border)] bg-[var(--surface)]",
        compact ? "grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center" : "flex min-h-96 flex-col p-5 sm:p-6",
      )}
    >
      {!compact ? <ArticleThumbnail article={article} compact={false} /> : null}
      <div className={cn("min-w-0", compact && "flex items-start gap-4")}>
        {compact ? <ArticleThumbnail article={article} compact /> : null}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{article.siteName ?? "Sumber artikel"}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
          </div>
          <h2 className={cn("font-editorial font-semibold leading-tight", compact ? "text-2xl" : "mt-5 text-3xl")}>
            <Link className="break-words decoration-1 underline-offset-4 group-hover:underline" to={"/articles/" + article.id}>{title}</Link>
          </h2>
          {article.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}
          {article.tags && article.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tag artikel">
              {article.tags.map((tag) => <li key={tag.id} className="border border-[var(--border-muted)] px-2 py-1 text-xs">{tag.name}</li>)}
            </ul>
          ) : null}
        </div>
      </div>
      <div className={cn("flex flex-wrap items-center justify-between gap-3 pt-5", compact && "sm:col-start-2 sm:row-start-1 sm:flex-col sm:items-end sm:justify-center sm:pt-0")}>
        <div className="flex flex-wrap items-center gap-3">
          <ReadingStatusBadge article={article} />
          <ReadingProgress article={article} />
          {article.estimatedReadingMinutes ? <span className="text-xs text-[var(--text-muted)]">{article.estimatedReadingMinutes} menit baca</span> : null}
        </div>
        <ArticleActions article={article} actionPending={actionPending} onUpdate={onUpdate} onDelete={onDelete} />
        {onTagChange ? <ArticleTagManager article={article} tags={availableTags} tagsLoading={tagsLoading} tagsError={tagsError} actionPending={actionPending} onTagChange={onTagChange} /> : null}
      </div>
    </motion.article>
  );
}

// Menampilkan kumpulan artikel dalam layout grid yang tetap memakai satu dataset query.
export function ArticleGrid({ articles, actionPending, onUpdate, onDelete, availableTags, tagsLoading, tagsError, onTagChange }: ArticleCollectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => <ArticleCard key={article.id} article={article} compact={false} actionPending={actionPending} onUpdate={onUpdate} onDelete={onDelete} availableTags={availableTags} tagsLoading={tagsLoading} tagsError={tagsError} onTagChange={onTagChange} />)}
    </div>
  );
}

// Menampilkan kumpulan artikel dalam layout list tanpa membuat query berbeda dari mode grid.
export function ArticleList({ articles, actionPending, onUpdate, onDelete, availableTags, tagsLoading, tagsError, onTagChange }: ArticleCollectionProps) {
  return (
    <div className="grid gap-3">
      {articles.map((article) => <ArticleCard key={article.id} article={article} compact actionPending={actionPending} onUpdate={onUpdate} onDelete={onDelete} availableTags={availableTags} tagsLoading={tagsLoading} tagsError={tagsError} onTagChange={onTagChange} />)}
    </div>
  );
}
