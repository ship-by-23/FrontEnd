import { Highlighter, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/feedback/states";
import { Dialog } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Field } from "../../components/ui/form-controls";
import type { Highlight } from "../../lib/api/types";
import {
  getHighlightArticleTitle,
  getHighlightDate,
} from "./highlights-utils";
import type { ReaderSelection } from "./selection-utils";

type SelectionToolbarProps = {
  selection: ReaderSelection | null;
  disabled: boolean;
  onHighlight: () => void;
  onAddNote: () => void;
};

// Menyediakan aksi highlight tanpa mengambil alih native text selection pada Reader.
export function SelectionToolbar({ selection, disabled, onHighlight, onAddNote }: SelectionToolbarProps) {
  if (!selection) return null;

  const toolbarTop = selection.top >= 64 ? selection.top - 56 : selection.top + 12;
  return (
    <div
      className="fixed z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap gap-2 border border-[var(--border)] bg-[var(--text)] p-2 text-[var(--surface)] shadow-[0.35rem_0.35rem_0_var(--accent)]"
      style={{ left: Math.max(8, Math.min(selection.left, window.innerWidth - 8)), top: Math.max(8, toolbarTop) }}
      role="toolbar"
      aria-label="Aksi teks terpilih"
      onMouseDown={(event) => event.preventDefault()}
    >
      <Button
        variant="secondary"
        className="min-h-10 border-[var(--surface)] bg-[var(--surface)] px-3 text-xs"
        disabled={disabled}
        onClick={onHighlight}
      >
        <Highlighter className="size-4" aria-hidden="true" />
        {disabled ? "Menyimpan…" : "Highlight"}
      </Button>
      <Button
        variant="ghost"
        className="min-h-10 border-[var(--surface)] px-3 text-xs text-[var(--surface)] hover:bg-white/10"
        disabled={disabled}
        onClick={onAddNote}
      >
        Dengan catatan
      </Button>
    </div>
  );
}

type HighlightCardProps = {
  highlight: Highlight;
  isPending: boolean;
  onEdit: (highlight: Highlight) => void;
  onDelete: (highlight: Highlight) => void;
};

// Menampilkan quote, konteks, note, dan link artikel sumber dari data API nyata.
export function HighlightCard({ highlight, isPending, onEdit, onDelete }: HighlightCardProps) {
  return (
    <li className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
              to={`/articles/${encodeURIComponent(highlight.articleId)}`}
            >
              <Highlighter className="size-4" aria-hidden="true" />
              <span className="break-words">{getHighlightArticleTitle(highlight)}</span>
            </Link>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Dibuat {getHighlightDate(highlight.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="min-h-10 px-3" disabled={isPending} onClick={() => onEdit(highlight)}>
              <Pencil className="size-4" aria-hidden="true" />Edit note
            </Button>
            <Button variant="ghost" className="min-h-10 px-3 text-[var(--danger)] hover:bg-[color:var(--danger)]/10" disabled={isPending} onClick={() => onDelete(highlight)}>
              <Trash2 className="size-4" aria-hidden="true" />Hapus
            </Button>
          </div>
        </div>

        <blockquote className="whitespace-pre-wrap border-l-4 border-[var(--accent)] pl-4 text-lg leading-8">
          {highlight.prefix ? <span className="text-[var(--text-muted)]">…{highlight.prefix}</span> : null}
          <span className="font-semibold">{highlight.quote}</span>
          {highlight.suffix ? <span className="text-[var(--text-muted)]">{highlight.suffix}…</span> : null}
        </blockquote>

        {highlight.note ? (
          <div className="border-t border-[var(--border-muted)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Catatan</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{highlight.note}</p>
          </div>
        ) : (
          <p className="text-sm italic text-[var(--text-muted)]">Belum ada catatan.</p>
        )}
      </div>
    </li>
  );
}

type HighlightListProps = {
  highlights: Highlight[];
  isPending: boolean;
  onEdit: (highlight: Highlight) => void;
  onDelete: (highlight: Highlight) => void;
};

// Menampilkan daftar global highlight dan empty state ketika API benar-benar mengembalikan array kosong.
export function HighlightList({ highlights, isPending, onEdit, onDelete }: HighlightListProps) {
  if (highlights.length === 0) {
    return <EmptyState title="Belum ada highlight" description="Pilih bagian penting dari artikel di Reader untuk menyimpannya di sini." />;
  }

  return (
    <ul className="grid gap-4">
      {highlights.map((highlight) => (
        <HighlightCard key={highlight.id} highlight={highlight} isPending={isPending} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

type NoteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialNote: string;
  error?: unknown;
  isPending: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

// Menyediakan form note yang mempertahankan isi user ketika mutation gagal.
function NoteDialog({ open, title, description, initialNote, error, isPending, errorMessage, onClose, onSubmit }: NoteDialogProps) {
  const [note, setNote] = useState(initialNote);

  // Mengirim note ke mutation setelah mencegah submit kosong yang tidak disengaja.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    try {
      await onSubmit(note);
    } catch {
      // Error mutation tetap ditampilkan di dialog agar isi note user tidak hilang.
    }
  }

  return (
    <Dialog open={open} title={title} titleId="highlight-note-dialog-title" description={description} onClose={onClose}>
      <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Catatan (opsional)" htmlFor="highlight-note">
          <textarea
            id="highlight-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-32 w-full resize-y rounded-[3px] border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)] disabled:opacity-60"
            placeholder="Tulis konteks atau pemikiranmu…"
            disabled={isPending}
            autoFocus
          />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]" role="alert">{errorMessage}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" disabled={isPending} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

type CreateHighlightNoteDialogProps = {
  open: boolean;
  selection: ReaderSelection | null;
  error?: unknown;
  isPending: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

// Membuka form note sebelum create highlight ketika user memilih aksi dengan catatan.
export function CreateHighlightNoteDialog(props: CreateHighlightNoteDialogProps) {
  return (
    <NoteDialog
      key={props.open ? `${props.selection?.startOffset ?? "open"}-${props.selection?.endOffset ?? ""}` : "closed"}
      open={props.open}
      title="Simpan highlight dengan catatan"
      description={props.selection ? `“${props.selection.quote}”` : "Tambahkan catatan opsional pada selection ini."}
      initialNote=""
      error={props.error}
      isPending={props.isPending}
      errorMessage={props.errorMessage}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}

type EditNoteDialogProps = {
  highlight: Highlight | null;
  error?: unknown;
  isPending: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

// Membuka editor note untuk highlight yang dipilih dari global list atau Reader.
export function EditNoteDialog(props: EditNoteDialogProps) {
  return (
    <NoteDialog
      key={props.highlight ? `${props.highlight.id}-${props.highlight.updatedAt ?? props.highlight.createdAt}` : "closed"}
      open={Boolean(props.highlight)}
      title="Edit catatan"
      description={props.highlight?.quote ?? "Perbarui catatan highlight."}
      initialNote={props.highlight?.note ?? ""}
      error={props.error}
      isPending={props.isPending}
      errorMessage={props.errorMessage}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}

type DeleteHighlightDialogProps = {
  highlight: Highlight | null;
  error?: unknown;
  isPending: boolean;
  errorMessage: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

// Meminta konfirmasi sebelum menghapus highlight dan note yang terhubung.
export function DeleteHighlightDialog({ highlight, error, isPending, errorMessage, onClose, onConfirm }: DeleteHighlightDialogProps) {
  // Mengirim delete hanya sekali agar user tidak membuat duplicate mutation.
  async function handleConfirm() {
    if (isPending) return;
    try {
      await onConfirm();
    } catch {
      // Error mutation dirender di dalam dialog agar konteks penghapusan tetap terjaga.
    }
  }

  return (
    <Dialog
      open={Boolean(highlight)}
      title="Hapus highlight?"
      titleId="highlight-delete-dialog-title"
      description="Highlight dan catatan yang terhubung akan dihapus dari library pribadi."
      onClose={onClose}
    >
      {highlight ? (
        <div>
          <p className="border-l-2 border-[var(--danger)] pl-3 text-sm leading-6">{highlight.quote}</p>
          {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{errorMessage}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" disabled={isPending} onClick={onClose}>Batal</Button>
            <Button variant="danger" disabled={isPending} onClick={() => void handleConfirm()}>{isPending ? "Menghapus…" : "Hapus highlight"}</Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
