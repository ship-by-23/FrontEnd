import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type RefObject } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ErrorState } from "../../components/feedback/states";
import type { Article, Highlight } from "../../lib/api/types";
import {
  createHighlight,
  getArticleHighlights,
  unwrapHighlights,
  updateHighlight,
  type CreateHighlightInput,
} from "./highlights-api";
import {
  CreateHighlightNoteDialog,
  EditNoteDialog,
  SelectionToolbar,
} from "./highlights-components";
import {
  getHighlightListErrorMessage,
  getHighlightMutationErrorMessage,
  normalizeHighlightNote,
} from "./highlights-utils";
import { getReaderSelection, type ReaderSelection } from "./selection-utils";
import { ReaderBody } from "../reader/reader-components";
import type { ReaderFont, ReaderTextSize } from "../appearance/appearance-utils";

type ReaderHighlightsProps = {
  article: Article;
  dark: boolean;
  readerFont: ReaderFont;
  textSize: ReaderTextSize;
  bodyRef: RefObject<HTMLElement | null>;
};

type CreateHighlightVariables = {
  selection: ReaderSelection;
  note?: string;
};

// Mengelola query, selection toolbar, mutation, dan dialog highlight tanpa memindahkan tanggung jawab artikel ke Reader page.
export function ReaderHighlights({ article, dark, readerFont, textSize, bodyRef }: ReaderHighlightsProps) {
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<ReaderSelection | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Highlight | null>(null);

  const highlightsQuery = useQuery({
    queryKey: ["article-highlights", article.id],
    queryFn: ({ signal }) => getArticleHighlights(article.id, signal),
    enabled: article.extractionStatus === "completed",
  });
  const highlights = highlightsQuery.data ? unwrapHighlights(highlightsQuery.data).data : [];

  const createMutation = useMutation({
    mutationFn: ({ selection: activeSelection, note }: CreateHighlightVariables) => {
      const input: CreateHighlightInput = {
        quote: activeSelection.quote,
        prefix: activeSelection.prefix,
        suffix: activeSelection.suffix,
        startOffset: activeSelection.startOffset,
        endOffset: activeSelection.endOffset,
      };
      const normalizedNote = note === undefined ? undefined : normalizeHighlightNote(note);
      if (normalizedNote) input.note = normalizedNote;
      return createHighlight(article.id, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["article-highlights", article.id] }),
        queryClient.invalidateQueries({ queryKey: ["highlights"] }),
      ]);
      clearSelection();
      setNoteDialogOpen(false);
      toast.success("Highlight tersimpan.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ highlightId, note }: { highlightId: string; note: string }) => updateHighlight(highlightId, { note: normalizeHighlightNote(note) ?? null }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["article-highlights", article.id] }),
        queryClient.invalidateQueries({ queryKey: ["highlights"] }),
      ]);
      setEditTarget(null);
      toast.success("Catatan highlight diperbarui.");
    },
  });

  useEffect(() => {
    // Membaca selection dari event browser tanpa menghentikan selection native atau keyboard selection.
    function handleSelectionChange() {
      const root = bodyRef.current;
      const nextSelection = root ? getReaderSelection(root) : null;
      setSelection((current) => {
        if (!current || !nextSelection) return nextSelection;
        return current.quote === nextSelection.quote
          && current.startOffset === nextSelection.startOffset
          && current.endOffset === nextSelection.endOffset
          ? current
          : nextSelection;
      });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);
    window.addEventListener("resize", handleSelectionChange);
    window.addEventListener("scroll", handleSelectionChange, { passive: true });
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);
      window.removeEventListener("resize", handleSelectionChange);
      window.removeEventListener("scroll", handleSelectionChange);
    };
  }, [bodyRef]);

  // Menghapus selection browser setelah mutation selesai agar toolbar tidak tertinggal pada quote lama.
  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  // Menyimpan highlight langsung tanpa membuka form note.
  function handleCreateHighlight() {
    if (!selection || createMutation.isPending) return;
    createMutation.reset();
    createMutation.mutate({ selection });
  }

  // Membuka dialog note dengan selection yang sudah disalin ke state lokal.
  function handleOpenNoteDialog() {
    if (!selection || createMutation.isPending) return;
    createMutation.reset();
    setNoteDialogOpen(true);
  }

  // Membuat highlight dari selection aktif dan note yang diisi user.
  async function handleCreateWithNote(note: string) {
    if (!selection) return;
    await createMutation.mutateAsync({ selection, note });
  }

  // Mengirim perubahan note dari dialog edit ke endpoint PATCH resmi.
  async function handleUpdateNote(note: string) {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ highlightId: editTarget.id, note });
  }

  // Membuka editor note ketika mark yang tersimpan diklik pada Reader.
  function handleHighlightClick(highlightId: string) {
    const target = highlights.find((highlight) => highlight.id === highlightId);
    if (target) {
      updateMutation.reset();
      setEditTarget(target);
    }
  }

  return (
    <div className="relative">
      <SelectionToolbar
        selection={selection}
        disabled={createMutation.isPending}
        onHighlight={handleCreateHighlight}
        onAddNote={handleOpenNoteDialog}
      />

      {createMutation.error ? <p className="mb-4 border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="alert">{getHighlightMutationErrorMessage(createMutation.error, "create")}</p> : null}

      {highlightsQuery.isError ? (
        <div className="mb-6">
          <ErrorState
            title="Highlight artikel belum dapat dimuat"
            message={getHighlightListErrorMessage(highlightsQuery.error)}
            onRetry={() => void highlightsQuery.refetch()}
          />
        </div>
      ) : null}
      {highlightsQuery.isFetching && highlights.length > 0 ? <p className="mb-3 text-sm text-[var(--text-muted)]" role="status">Memperbarui highlight…</p> : null}

      <ReaderBody
        contentHtml={article.contentHtml}
        dark={dark}
        readerFont={readerFont}
        textSize={textSize}
        bodyRef={bodyRef}
        highlights={highlights}
        onHighlightClick={handleHighlightClick}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-current/20 pt-5 text-sm">
        <span className="text-[var(--text-muted)]">{highlights.length ? `${highlights.length} highlight pada artikel ini` : "Belum ada highlight pada artikel ini"}</span>
        <Link className="font-semibold underline-offset-4 hover:underline" to="/highlights">Lihat semua highlight</Link>
      </div>

      <CreateHighlightNoteDialog
        open={noteDialogOpen}
        selection={selection}
        error={createMutation.error}
        isPending={createMutation.isPending}
        errorMessage={getHighlightMutationErrorMessage(createMutation.error, "create")}
        onClose={() => {
          if (!createMutation.isPending) setNoteDialogOpen(false);
        }}
        onSubmit={handleCreateWithNote}
      />
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
    </div>
  );
}
