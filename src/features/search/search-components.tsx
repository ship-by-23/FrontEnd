import { Clock3, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/form-controls";
import { getExtractionStatusLabel, getReadingStatusLabel, type LibraryUrlState } from "../library/library-utils";
import { FilterFields, type LibraryFilterName } from "../library/library-toolbar";
import type { ArticleCollection, ArticleSummary, Tag } from "../../lib/api/types";
import { formatDate } from "../../lib/utils";
import { getSearchSnippet } from "./search-utils";

type SearchInputProps = {
  value: string;
  isDebouncing: boolean;
  onChange: (value: string) => void;
};

// Menyediakan input Search berlabel jelas dan memberi feedback saat debounce masih berlangsung.
export function SearchInput({ value, isDebouncing, onChange }: SearchInputProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor="article-search-input">Cari artikel</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
        <Input
          id="article-search-input"
          className="min-h-14 pl-12 text-lg"
          type="search"
          placeholder="Cari judul, deskripsi, atau isi…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={isDebouncing ? "search-debounce-status" : undefined}
        />
      </div>
      {isDebouncing ? <p id="search-debounce-status" className="text-sm text-[var(--text-muted)]" role="status">Menunggu jeda ketik sebelum mencari…</p> : null}
    </div>
  );
}

type SearchFiltersProps = {
  state: LibraryUrlState;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: boolean;
  hasActiveFilters: boolean;
  onChange: (name: LibraryFilterName, value: string) => void;
  onClearFilters: () => void;
};

// Menyediakan filter Search yang identik dengan filter Library pada desktop dan mobile.
export function SearchFilters({
  state,
  tags,
  tagsLoading,
  tagsError,
  hasActiveFilters,
  onChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Membuka filter Search pada layar kecil tanpa memindahkan state ke global store.
  function openFilterDialog() {
    setFilterDialogOpen(true);
  }

  // Menutup filter Search setelah user menyelesaikan pilihannya.
  function closeFilterDialog() {
    setFilterDialogOpen(false);
  }

  return (
    <section className="mt-6 border-y border-[var(--border)] py-4" aria-label="Filter pencarian">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="lg:hidden" onClick={openFilterDialog}>
          <SlidersHorizontal className="size-4" aria-hidden="true" />Filter
        </Button>
        {hasActiveFilters ? (
          <Button variant="ghost" onClick={onClearFilters}>
            <X className="size-4" aria-hidden="true" />Bersihkan filter
          </Button>
        ) : null}
      </div>

      <div className="mt-4 hidden lg:block">
        <FilterFields state={state} tags={tags} tagsLoading={tagsLoading} tagsError={tagsError} onChange={onChange} />
      </div>

      <Dialog
        open={filterDialogOpen}
        title="Filter pencarian"
        titleId="search-filter-dialog-title"
        description="Gunakan pilihan penyaring yang sama seperti di Library."
        onClose={closeFilterDialog}
        size="wide"
      >
        <FilterFields state={state} tags={tags} tagsLoading={tagsLoading} tagsError={tagsError} onChange={onChange} />
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={closeFilterDialog}>Selesai</Button>
        </div>
      </Dialog>
    </section>
  );
}

// Menampilkan cuplikan sebagai text node agar markup dari API tidak dieksekusi oleh browser.
export function MatchedSnippet({ snippet }: { snippet: string | null }) {
  if (!snippet) return null;

  return (
    <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm leading-7 text-[var(--text-muted)]">
      <span className="sr-only">Cuplikan yang cocok: </span>
      {snippet}
    </p>
  );
}

// Menampilkan satu hasil Search dengan metadata, status, tag, dan tautan menuju Reader.
export function SearchResultItem({ article }: { article: ArticleSummary }) {
  const statusLabel = article.extractionStatus === "completed"
    ? getReadingStatusLabel(article.readingStatus)
    : getExtractionStatusLabel(article.extractionStatus);
  const snippet = getSearchSnippet(article);

  return (
    <article className="border-b border-[var(--border-muted)] py-6 first:border-t first:border-[var(--border)] sm:py-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--text-muted)]">
        <span>{article.siteName || "Situs tidak tersedia"}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(article.createdAt)}</span>
        <span className="border border-[var(--border-muted)] px-2 py-1 font-semibold">{statusLabel}</span>
      </div>
      <h2 className="font-editorial mt-3 text-3xl font-semibold leading-tight">
        <Link className="underline-offset-4 hover:underline" to={`/articles/${article.id}`}>
          {article.title || "Artikel tanpa judul"}
        </Link>
      </h2>
      {article.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}
      <MatchedSnippet snippet={snippet} />
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
        {article.estimatedReadingMinutes ? (
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden="true" />{article.estimatedReadingMinutes} menit baca
          </span>
        ) : null}
        {article.tags?.map((tag) => <span key={tag.id} className="border border-[var(--border-muted)] px-2 py-1">{tag.name}</span>)}
      </div>
    </article>
  );
}

// Menampilkan daftar hasil Search tanpa membuat query tambahan untuk setiap item.
export function SearchResultList({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="divide-y divide-[var(--border-muted)] border-y border-[var(--border)]">
      {articles.map((article) => <SearchResultItem key={article.id} article={article} />)}
    </div>
  );
}

type SearchPaginationProps = {
  page: number;
  pagination: ArticleCollection["pagination"];
  onPageChange: (page: number) => void;
};

// Menjaga pagination Search mengikuti total halaman dari backend, bukan panjang array lokal.
export function SearchPagination({ page, pagination, onPageChange }: SearchPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination pencarian">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</Button>
      <span className="text-sm" aria-live="polite">Halaman {page} dari {pagination.totalPages} · {pagination.totalItems} artikel</span>
      <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>Berikutnya</Button>
    </nav>
  );
}
