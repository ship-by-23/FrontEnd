import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams, type SetURLSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { getTags, unwrapTags } from "../features/articles/article-api";
import { getLibraryArticles } from "../features/library/library-api";
import { type LibraryFilterName } from "../features/library/library-toolbar";
import {
  getSearchErrorMessage,
  hasActiveSearchFilters,
  parseSearchSearchParams,
  toSearchApiParams,
} from "../features/search/search-utils";
import {
  SearchFilters,
  SearchInput,
  SearchPagination,
  SearchResultList,
} from "../features/search/search-components";

// Menjaga query Search lokal tetap responsif sebelum URL menjadi sumber request yang sudah di-debounce.
function useDebouncedSearchValue(
  searchValue: string,
  queryFromUrl: string,
  setSearchParams: SetURLSearchParams,
) {
  useEffect(() => {
    const nextQuery = searchValue.trim();
    if (nextQuery === queryFromUrl) return;

    const timeoutId = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (nextQuery) next.set("q", nextQuery);
        else next.delete("q");
        next.delete("query");
        next.delete("page");
        return next;
      }, { replace: true });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [queryFromUrl, searchValue, setSearchParams]);
}

// Menampilkan Search dengan URL state, filter Library, debounce, pagination, dan state API lengkap.
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseSearchSearchParams(searchParams);
  const [searchValue, setSearchValue] = useState(state.query);
  const apiParams = toSearchApiParams(state);
  const hasDataFilters = hasActiveSearchFilters(state);
  const hasSearchState = Boolean(state.query || hasDataFilters);
  const isDebouncing = searchValue.trim() !== state.query;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setSearchValue(state.query));
    return () => window.cancelAnimationFrame(frameId);
  }, [state.query]);

  useDebouncedSearchValue(searchValue, state.query, setSearchParams);

  const articlesQuery = useQuery({
    queryKey: ["articles", "search", apiParams],
    queryFn: ({ signal }) => getLibraryArticles(apiParams, signal),
    enabled: hasSearchState,
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => getTags(signal),
  });

  const tags = tagsQuery.data ? unwrapTags(tagsQuery.data) : [];

  // Menulis filter Search ke URL dan mereset pagination agar hasil baru dimulai dari halaman pertama.
  function updateFilter(name: LibraryFilterName, value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      next.delete("page");
      return next;
    });
  }

  // Menghapus query dan seluruh filter Search tanpa mengisi ulang data dummy.
  function clearSearch() {
    setSearchValue("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ["q", "query", "status", "tagId", "favorite", "archived", "sort", "page"].forEach((name) => next.delete(name));
      return next;
    }, { replace: true });
  }

  // Mengubah halaman sambil mempertahankan query dan seluruh filter yang sedang aktif.
  function changePage(page: number) {
    if (page < 1) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(page));
      return next;
    });
  }

  // Mengembalikan halaman ke batas backend setelah jumlah hasil berubah karena filter atau query.
  useEffect(() => {
    const totalPages = articlesQuery.data?.pagination.totalPages;
    if (totalPages === undefined) return;
    if (totalPages === 0 && state.page !== 1) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("page");
        return next;
      }, { replace: true });
      return;
    }
    if (totalPages > 0 && state.page > totalPages) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("page", String(totalPages));
        return next;
      }, { replace: true });
    }
  }, [articlesQuery.data?.pagination.totalPages, setSearchParams, state.page]);

  const emptyTitle = state.query ? "Tidak ada hasil" : "Tidak ada artikel yang cocok";
  const emptyDescription = state.query
    ? `Tidak ada artikel yang cocok dengan “${state.query}”.`
    : "Coba ubah filter atau simpan artikel baru ke library.";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Temukan kembali</p>
        <h1 className="font-editorial mt-1 text-5xl font-semibold">Pencarian</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Cari gagasan dari judul, deskripsi, dan isi artikel yang tersimpan di pustaka pribadimu.</p>
      </header>

      <section className="my-6" aria-label="Pencarian artikel">
        <SearchInput value={searchValue} isDebouncing={isDebouncing} onChange={setSearchValue} />
        <SearchFilters
          state={state}
          tags={tags}
          tagsLoading={tagsQuery.isPending}
          tagsError={tagsQuery.isError}
          hasActiveFilters={Boolean(state.query || hasDataFilters)}
          onChange={updateFilter}
          onClearFilters={clearSearch}
        />
      </section>

      {articlesQuery.isFetching && articlesQuery.data ? <p className="mb-4 text-sm text-[var(--text-muted)]" role="status">Memperbarui hasil pencarian…</p> : null}
      {isDebouncing ? <p className="mb-4 text-sm text-[var(--text-muted)]" role="status">Pencarian akan diperbarui setelah kamu selesai mengetik.</p> : null}

      {!hasSearchState ? (
        <EmptyState title="Cari di seluruh pustaka" description="Masukkan kata atau gagasan yang ingin kamu temukan kembali, atau gunakan filter untuk melihat artikel tertentu." />
      ) : articlesQuery.isPending ? (
        <LoadingState label="Mencari artikel…" />
      ) : articlesQuery.isError ? (
        <ErrorState message={getSearchErrorMessage(articlesQuery.error)} onRetry={() => void articlesQuery.refetch()} />
      ) : articlesQuery.data.data.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={<Button variant="secondary" onClick={clearSearch}>Bersihkan pencarian</Button>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">
            Menampilkan {articlesQuery.data.data.length} dari {articlesQuery.data.pagination.totalItems} artikel.
          </p>
          <SearchResultList articles={articlesQuery.data.data} />
          <SearchPagination page={state.page} pagination={articlesQuery.data.pagination} onPageChange={changePage} />
        </>
      )}
    </div>
  );
}
