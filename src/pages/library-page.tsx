import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "../components/feedback/states";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { getTags, unwrapTags } from "../features/articles/article-api";
import { deleteArticle, getLibraryArticles, updateArticle, type ArticleUpdateInput } from "../features/library/library-api";
import { ArticleGrid, ArticleList } from "../features/library/library-components";
import { LibraryToolbar } from "../features/library/library-toolbar";
import { attachArticleTag, detachArticleTag, type ArticleTagAction } from "../features/tags/tags-api";
import { useAppearance } from "../features/appearance/appearance-provider";
import {
  applyArticleUpdateToCollection,
  findTagName,
  getLibraryErrorMessage,
  getLibraryMutationErrorMessage,
  hasActiveLibraryFilters,
  parseLibrarySearchParams,
  removeArticleFromCollection,
  toLibraryApiParams,
} from "../features/library/library-utils";
import type { ArticleCollection, ArticleSummary } from "../lib/api/types";

type FilterName = "status" | "tagId" | "favorite" | "archived" | "sort";

// Menjaga bentuk shell Library tetap stabil saat request awal sedang berjalan.
function LibrarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Memuat pustaka">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="min-h-96 border border-[var(--border-muted)] bg-[var(--surface)] p-5" aria-hidden="true">
          <div className="aspect-[16/8] animate-pulse bg-[var(--surface-muted)]" />
          <div className="mt-6 h-3 w-1/3 animate-pulse bg-[var(--surface-muted)]" />
          <div className="mt-4 h-8 w-4/5 animate-pulse bg-[var(--surface-muted)]" />
          <div className="mt-3 h-4 w-full animate-pulse bg-[var(--surface-muted)]" />
          <div className="mt-2 h-4 w-2/3 animate-pulse bg-[var(--surface-muted)]" />
        </div>
      ))}
      <span className="sr-only">Memuat pustaka…</span>
    </div>
  );
}

// Menampilkan kontrol pagination berdasarkan angka dari response backend, bukan jumlah item lokal saja.
function LibraryPagination({
  page,
  pagination,
  onPageChange,
}: {
  page: number;
  pagination: ArticleCollection["pagination"];
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination library">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</Button>
      <span className="text-sm" aria-live="polite">Halaman {page} dari {pagination.totalPages} · {pagination.totalItems} artikel</span>
      <Button variant="secondary" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>Berikutnya</Button>
    </nav>
  );
}

// Menyimpan perubahan state artikel dengan optimistic update yang memiliki rollback aman.
function useLibraryArticleUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  state: ReturnType<typeof parseLibrarySearchParams>,
) {
  return useMutation({
    mutationFn: ({ articleId, input }: { articleId: string; input: ArticleUpdateInput }) => updateArticle(articleId, input),
    onMutate: async ({ articleId, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ArticleCollection>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, applyArticleUpdateToCollection(previous, articleId, input, state));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(getLibraryMutationErrorMessage(error, "update"));
    },
    onSuccess: (_result, variables) => {
      const message = variables.input.isFavorite !== undefined
        ? variables.input.isFavorite ? "Artikel ditambahkan ke favorit." : "Artikel dihapus dari favorit."
        : variables.input.isArchived !== undefined
          ? variables.input.isArchived ? "Artikel diarsipkan." : "Artikel dikeluarkan dari arsip."
          : "Status baca diperbarui.";
      toast.success(message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles", "library"] });
    },
  });
}

// Menampilkan halaman Library dengan satu query dataset untuk seluruh kombinasi filter dan view.
export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences, updatePreferences } = useAppearance();
  const [searchValue, setSearchValue] = useState(() => searchParams.get("query")?.trim() ?? "");
  const [deleteTarget, setDeleteTarget] = useState<ArticleSummary | null>(null);
  const state = parseLibrarySearchParams(searchParams, preferences.libraryView);
  const apiParams = toLibraryApiParams(state);
  const libraryQueryKey = ["articles", "library", apiParams] as const;
  const queryClient = useQueryClient();

  const articlesQuery = useQuery({
    queryKey: libraryQueryKey,
    queryFn: ({ signal }) => getLibraryArticles(apiParams, signal),
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => getTags(signal),
  });
  const updateMutation = useLibraryArticleUpdate(queryClient, libraryQueryKey, state);
  const deleteMutation = useMutation({
    mutationFn: (articleId: string) => deleteArticle(articleId),
    onSuccess: (_result, articleId) => {
      queryClient.setQueryData<ArticleCollection>(libraryQueryKey, (current) => current ? removeArticleFromCollection(current, articleId) : current);
      setDeleteTarget(null);
      toast.success("Artikel dihapus dari library.");
    },
    onError: (error) => {
      toast.error(getLibraryMutationErrorMessage(error, "delete"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles", "library"] });
    },
  });

  const tagMutation = useMutation({
    mutationFn: ({ articleId, tagId, action }: ArticleTagAction) => action === "attach" ? attachArticleTag(articleId, tagId) : detachArticleTag(articleId, tagId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const tags = tagsQuery.data ? unwrapTags(tagsQuery.data) : [];
  const hasFilters = hasActiveLibraryFilters(state);
  const activeTagName = findTagName(tags, state.tagId);
  const pendingUpdateArticleId = updateMutation.variables?.articleId;
  const pendingDeleteArticleId = deleteMutation.variables;

  // Menjalankan perubahan relasi tag dari quick action artikel dan mempertahankan error untuk picker.
  async function handleTagChange(input: ArticleTagAction) {
    return tagMutation.mutateAsync(input);
  }

  // Menjaga input pencarian lokal mengikuti URL ketika user memakai back-forward browser.
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setSearchValue(state.query));
    return () => window.cancelAnimationFrame(frameId);
  }, [state.query]);

  // Menunda perubahan query agar setiap karakter tidak langsung menghasilkan request full-text baru.
  useEffect(() => {
    const nextQuery = searchValue.trim();
    if (nextQuery === state.query) return;

    const timeoutId = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (nextQuery) next.set("query", nextQuery);
        else next.delete("query");
        next.delete("page");
        return next;
      }, { replace: true });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchValue, setSearchParams, state.query]);

  // Mengembalikan page ke batas backend setelah filter atau delete membuat page aktif tidak lagi valid.
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

  // Menulis satu filter ke URL dan mereset pagination agar hasil baru dimulai dari page pertama.
  function updateFilter(name: FilterName, value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      next.delete("page");
      return next;
    });
  }

  // Mengubah mode grid/list tanpa mengubah dataset atau query API.
  function updateView(view: "grid" | "list") {
    updatePreferences({ libraryView: view });
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("view", view);
      return next;
    });
  }

  // Menghapus filter data dari URL tetapi mempertahankan mode tampilan yang dipilih user.
  function clearFilters() {
    setSearchValue("");
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ["status", "tagId", "favorite", "archived", "sort", "query", "page"].forEach((name) => next.delete(name));
      return next;
    });
  }

  // Mengubah nomor page dengan tetap mempertahankan seluruh filter yang sedang aktif.
  function changePage(page: number) {
    if (page < 1) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(page));
      return next;
    });
  }

  // Mengirim quick action artikel dan mencegah duplicate submit ketika mutation sedang berjalan.
  function handleArticleUpdate(articleId: string, input: ArticleUpdateInput) {
    if (updateMutation.isPending || deleteMutation.isPending) return;
    updateMutation.mutate({ articleId, input });
  }

  // Membuka confirmation dialog sebelum operasi delete permanen dilakukan.
  function requestDelete(article: ArticleSummary) {
    if (updateMutation.isPending || deleteMutation.isPending) return;
    setDeleteTarget(article);
  }

  // Mengonfirmasi delete setelah user melihat judul artikel yang akan dihapus.
  function confirmDelete() {
    if (!deleteTarget || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  const emptyTitle = hasFilters ? "Tidak ada artikel yang cocok" : "Pustakamu masih kosong";
  const emptyDescription = hasFilters
    ? activeTagName ? "Tidak ada artikel pada tag " + activeTagName + " dengan kombinasi filter saat ini." : "Coba ubah filter, sort, atau kata pencarian."
    : "Simpan artikel pertama untuk mulai membangun ruang baca pribadimu.";

  return (
    <div>
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pustaka pribadi</p>
          <h1 className="font-editorial mt-1 text-5xl font-semibold">Library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Satu ruang untuk artikel yang ingin kamu baca, kelola, dan temukan kembali.</p>
        </div>
        <Link to="/articles/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white">
          <Plus className="size-4" aria-hidden="true" />Simpan artikel
        </Link>
      </header>

      <LibraryToolbar
        state={state}
        tags={tags}
        tagsLoading={tagsQuery.isPending}
        tagsError={tagsQuery.isError}
        searchValue={searchValue}
        hasActiveFilters={hasFilters}
        onSearchChange={setSearchValue}
        onChange={updateFilter}
        onViewChange={updateView}
        onClearFilters={clearFilters}
      />

      {articlesQuery.isFetching && articlesQuery.data ? <p className="mb-4 text-sm text-[var(--text-muted)]" role="status">Memperbarui hasil library…</p> : null}
      {articlesQuery.isPending ? <LibrarySkeleton /> : articlesQuery.isError ? <ErrorState message={getLibraryErrorMessage(articlesQuery.error)} onRetry={() => void articlesQuery.refetch()} /> : articlesQuery.data.data.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={hasFilters
            ? <Button variant="secondary" onClick={clearFilters}>Bersihkan filter</Button>
            : <Link to="/articles/new" className="inline-flex min-h-11 items-center gap-2 border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white"><BookOpen className="size-4" aria-hidden="true" />Simpan artikel pertama</Link>}
        />
      ) : (
        <>
          {state.view === "grid"
            ? <ArticleGrid articles={articlesQuery.data.data} actionPending={Boolean(pendingUpdateArticleId || pendingDeleteArticleId || tagMutation.isPending)} onUpdate={handleArticleUpdate} onDelete={requestDelete} availableTags={tags} tagsLoading={tagsQuery.isPending} tagsError={tagsQuery.error} onTagChange={handleTagChange} />
            : <ArticleList articles={articlesQuery.data.data} actionPending={Boolean(pendingUpdateArticleId || pendingDeleteArticleId || tagMutation.isPending)} onUpdate={handleArticleUpdate} onDelete={requestDelete} availableTags={tags} tagsLoading={tagsQuery.isPending} tagsError={tagsQuery.error} onTagChange={handleTagChange} />}
          <LibraryPagination page={state.page} pagination={articlesQuery.data.pagination} onPageChange={changePage} />
        </>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        title="Hapus artikel secara permanen?"
        titleId="delete-article-dialog-title"
        description="Artikel, relasi tag, highlight, catatan, dan data ekstraksinya akan ikut dihapus. Tindakan ini tidak dapat dibatalkan."
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        {deleteTarget ? (
          <div>
            <p className="break-words border-l-2 border-[var(--danger)] pl-3 font-semibold">{deleteTarget.title ?? "Artikel tanpa judul"}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="ghost" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="danger" disabled={deleteMutation.isPending} onClick={confirmDelete}>{deleteMutation.isPending ? "Menghapus…" : "Hapus permanen"}</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
