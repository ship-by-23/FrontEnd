import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Highlighter } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import {
  deleteHighlight,
  getHighlights,
  unwrapHighlights,
  updateHighlight,
} from "../features/highlights/highlights-api";
import {
  DeleteHighlightDialog,
  EditNoteDialog,
  HighlightList,
} from "../features/highlights/highlights-components";
import {
  getHighlightListErrorMessage,
  getHighlightMutationErrorMessage,
  HIGHLIGHTS_PAGE_SIZE,
  parseHighlightsPage,
} from "../features/highlights/highlights-utils";
import type { Highlight } from "../lib/api/types";

// Menampilkan global highlights page dengan pagination dan data yang sepenuhnya berasal dari API.
export function HighlightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editTarget, setEditTarget] = useState<Highlight | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Highlight | null>(null);
  const page = parseHighlightsPage(searchParams.get("page"));
  const queryClient = useQueryClient();
  const highlightsQuery = useQuery({
    queryKey: ["highlights", { page, pageSize: HIGHLIGHTS_PAGE_SIZE }],
    queryFn: ({ signal }) => getHighlights(page, HIGHLIGHTS_PAGE_SIZE, signal),
  });
  const response = highlightsQuery.data ? unwrapHighlights(highlightsQuery.data) : null;
  const highlights = response?.data ?? [];
  const pagination = response?.pagination;

  const updateMutation = useMutation({
    mutationFn: ({ highlightId, note }: { highlightId: string; note: string }) => updateHighlight(highlightId, { note: note.trim() || null }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["highlights"] }),
        queryClient.invalidateQueries({ queryKey: ["article-highlights"] }),
      ]);
      setEditTarget(null);
      toast.success("Catatan highlight diperbarui.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (highlightId: string) => deleteHighlight(highlightId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["highlights"] }),
        queryClient.invalidateQueries({ queryKey: ["article-highlights"] }),
      ]);
      setDeleteTarget(null);
      toast.success("Highlight dihapus.");
    },
  });

  useEffect(() => {
    const totalPages = pagination?.totalPages;
    if (!totalPages) return;
    if (page > totalPages) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (totalPages === 1) next.delete("page");
        else next.set("page", String(totalPages));
        return next;
      }, { replace: true });
    }
  }, [page, pagination?.totalPages, setSearchParams]);

  // Mengubah page global highlights tanpa kehilangan parameter URL lain.
  function changePage(nextPage: number) {
    if (nextPage < 1 || (pagination && nextPage > pagination.totalPages)) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 1) next.delete("page");
      else next.set("page", String(nextPage));
      return next;
    });
  }

  // Mengirim note yang diedit ke endpoint PATCH dan mempertahankan dialog sampai server berhasil.
  async function handleUpdateNote(note: string) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ highlightId: editTarget.id, note });
  }

  // Menghapus highlight aktif setelah confirmation dialog menyelesaikan mutation.
  async function handleDeleteHighlight() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
  }

  if (highlightsQuery.isPending) return <LoadingState label="Memuat highlight…" />;
  if (highlightsQuery.isError) {
    return <ErrorState title="Highlight tidak dapat dimuat" message={getHighlightListErrorMessage(highlightsQuery.error)} onRetry={() => void highlightsQuery.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Knowledge capture</p>
          <h1 className="font-editorial mt-1 text-5xl font-semibold">Highlights</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Kutipan penting dan catatan dari artikel yang kamu simpan.</p>
        </div>
        <Highlighter className="size-9 text-[var(--success)]" aria-hidden="true" />
      </header>

      <section className="mt-8" aria-label="Daftar highlight">
        {pagination ? <p className="mb-4 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">Menampilkan {highlights.length} dari {pagination.totalItems} highlight.</p> : null}
        {highlights.length === 0 ? (
          <EmptyState title="Belum ada highlight" description="Pilih bagian penting dari artikel di Reader untuk menyimpannya di sini." />
        ) : (
          <HighlightList
            highlights={highlights}
            isPending={updateMutation.isPending || deleteMutation.isPending}
            onEdit={(highlight) => {
              updateMutation.reset();
              setEditTarget(highlight);
            }}
            onDelete={(highlight) => {
              deleteMutation.reset();
              setDeleteTarget(highlight);
            }}
          />
        )}
      </section>

      {pagination && pagination.totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination highlight">
          <Button variant="secondary" disabled={page <= 1 || updateMutation.isPending || deleteMutation.isPending} onClick={() => changePage(page - 1)}>Sebelumnya</Button>
          <span className="text-sm text-[var(--text-muted)]" aria-live="polite">Halaman {page} dari {pagination.totalPages}</span>
          <Button variant="secondary" disabled={page >= pagination.totalPages || updateMutation.isPending || deleteMutation.isPending} onClick={() => changePage(page + 1)}>Berikutnya</Button>
        </nav>
      ) : null}

      <EditNoteDialog
        highlight={editTarget}
        error={updateMutation.error}
        isPending={updateMutation.isPending}
        errorMessage={getHighlightMutationErrorMessage(updateMutation.error, "update")}
        onClose={() => {
          if (!updateMutation.isPending) setEditTarget(null);
        }}
        onSubmit={handleUpdateNote}
      />
      <DeleteHighlightDialog
        highlight={deleteTarget}
        error={deleteMutation.error}
        isPending={deleteMutation.isPending}
        errorMessage={getHighlightMutationErrorMessage(deleteMutation.error, "delete")}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteHighlight}
      />
    </div>
  );
}
