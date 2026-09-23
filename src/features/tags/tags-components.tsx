import { Tag as TagIcon, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/feedback/states";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Field, Input } from "../../components/ui/form-controls";
import type { ArticleSummary, Tag } from "../../lib/api/types";
import { formatDate } from "../../lib/utils";
import type { ArticleTagAction } from "./tags-api";
import { getTagListErrorMessage, getTagMutationErrorMessage, validateTagName } from "./tags-utils";

type TagChipProps = {
  tag: Tag;
  href?: string;
  onRemove?: () => void;
  disabled?: boolean;
};

// Menampilkan nama tag dengan visual ringan yang dapat dipakai pada directory, picker, dan artikel.
export function TagChip({ tag, href, onRemove, disabled = false }: TagChipProps) {
  const content = <span className="inline-flex min-h-8 items-center border border-[var(--border-muted)] bg-[var(--surface)] px-2.5 py-1 text-sm font-medium">{tag.name}</span>;

  return (
    <span className="inline-flex items-center gap-1">
      {href ? <Link className="rounded-[3px] hover:bg-[var(--surface-muted)]" to={href}>{content}</Link> : content}
      {onRemove ? (
        <Button
          variant="ghost"
          className="size-8 px-0 text-[var(--danger)]"
          aria-label={`Lepas tag ${tag.name}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </span>
  );
}

type TagPickerProps = {
  tags: Tag[];
  selectedTagIds: string[];
  isLoading?: boolean;
  error?: unknown;
  disabled?: boolean;
  label?: string;
  onToggle: (tagId: string) => void;
};

// Menyediakan picker tag terkontrol untuk Save Article, edit metadata, dan aksi artikel.
export function TagPicker({
  tags,
  selectedTagIds,
  isLoading = false,
  error,
  disabled = false,
  label = "Tag",
  onToggle,
}: TagPickerProps) {
  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="flex items-center gap-2 text-sm font-semibold"><TagIcon className="size-4" aria-hidden="true" />{label}</legend>
      {isLoading ? <p className="text-sm text-[var(--text-muted)]" role="status">Memuat tag…</p> : null}
      {!isLoading && error ? <p className="text-sm text-[var(--warning)]" role="status">{getTagListErrorMessage(error)} Tag tetap dapat dikelola dari halaman Tag.</p> : null}
      {!isLoading && !error && tags.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Belum ada tag. Buat tag dari halaman Tag terlebih dahulu.</p>
      ) : null}
      {!isLoading && !error && tags.length > 0 ? (
        <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" aria-label={`${label} yang tersedia`}>
          {tags.map((tag) => (
            <label key={tag.id} className="flex min-h-11 items-center gap-3 border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]">
              <input
                type="checkbox"
                value={tag.id}
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => onToggle(tag.id)}
                className="size-4 accent-[var(--text)]"
              />
              <span className="min-w-0 truncate">{tag.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

type TagNameDialogProps = {
  mode: "create" | "rename";
  open: boolean;
  initialName?: string;
  error?: unknown;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

// Menangani form create dan rename dengan validasi lokal minimal serta error backend yang tetap terlihat.
function TagNameDialog({ mode, open, initialName = "", error, isPending, onClose, onSubmit }: TagNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const title = mode === "create" ? "Buat tag" : "Rename tag";
  const description = mode === "create" ? "Gunakan nama yang mudah dikenali saat mengelompokkan artikel." : "Mengubah nama tidak menghapus artikel atau relasi yang sudah ada.";
  const errorMessage = fieldError ?? (error ? getTagMutationErrorMessage(error, mode) : undefined);

  // Menyimpan nama tag setelah input kosong ditolak dan mutation selesai.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const validationError = validateTagName(nextName);
    setFieldError(validationError);
    if (validationError || isPending) return;

    try {
      await onSubmit(nextName);
    } catch {
      // Pesan error mutation ditampilkan dari prop error agar tetap konsisten dengan API client.
    }
  }

  return (
    <Dialog
      open={open}
      title={title}
      titleId={`tag-${mode}-dialog-title`}
      description={description}
      onClose={onClose}
    >
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        <Field label="Nama tag" htmlFor={`tag-${mode}-name`} error={errorMessage}>
          <Input
            id={`tag-${mode}-name`}
            value={name}
            autoComplete="off"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? `tag-${mode}-name-error` : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
            }}
          />
        </Field>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" disabled={isPending} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan…" : mode === "create" ? "Buat tag" : "Simpan nama"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

type CreateTagDialogProps = Omit<TagNameDialogProps, "mode" | "initialName">;

// Membuka dialog khusus untuk membuat tag baru dari directory Tags.
export function CreateTagDialog(props: CreateTagDialogProps) {
  return <TagNameDialog key={props.open ? "open" : "closed"} {...props} mode="create" />;
}

type RenameTagDialogProps = Omit<TagNameDialogProps, "mode">;

// Membuka dialog rename dengan nama tag aktif sebagai nilai awal.
export function RenameTagDialog(props: RenameTagDialogProps) {
  return <TagNameDialog key={`${props.open ? "open" : "closed"}-${props.initialName ?? ""}`} {...props} mode="rename" />;
}

type DeleteTagDialogProps = {
  tag: Tag | null;
  error?: unknown;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

// Meminta konfirmasi penghapusan relasi tag tanpa memberi kesan bahwa artikel akan terhapus.
export function DeleteTagDialog({ tag, error, isPending, onClose, onConfirm }: DeleteTagDialogProps) {
  // Mengirim konfirmasi delete setelah user memahami dampaknya terhadap relasi artikel.
  async function handleConfirm() {
    if (isPending) return;
    try {
      await onConfirm();
    } catch {
      // Error mutation dirender di dalam dialog agar konteks tindakan tetap terjaga.
    }
  }

  return (
    <Dialog
      open={Boolean(tag)}
      title="Hapus tag?"
      titleId="tag-delete-dialog-title"
      description="Tag akan dilepas dari artikel terkait. Artikel dan isi artikel tetap tersimpan di library."
      onClose={onClose}
    >
      {tag ? (
        <div>
          <p className="border-l-2 border-[var(--danger)] pl-3 font-semibold break-words">{tag.name}</p>
          {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{getTagMutationErrorMessage(error, "delete")}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" disabled={isPending} onClick={onClose}>Batal</Button>
            <Button variant="danger" disabled={isPending} onClick={() => void handleConfirm()}>{isPending ? "Menghapus…" : "Hapus tag"}</Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

type TagArticleListProps = {
  articles: ArticleSummary[];
  actionPending?: boolean;
  onDetach: (articleId: string) => void;
};

// Menampilkan artikel yang memakai tag aktif dan menyediakan detach tanpa menghapus artikel.
export function TagArticleList({ articles, actionPending = false, onDetach }: TagArticleListProps) {
  if (articles.length === 0) {
    return <EmptyState title="Belum ada artikel" description="Artikel yang memakai tag ini akan tampil di sini." />;
  }

  return (
    <ul className="grid gap-3">
      {articles.map((article) => (
        <li key={article.id} className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">{article.siteName ?? "Sumber artikel"}</p>
              <h2 className="font-editorial mt-2 text-3xl font-semibold leading-tight">
                <Link className="break-words underline-offset-4 hover:underline" to={`/articles/${article.id}`}>{article.title ?? "Artikel tanpa judul"}</Link>
              </h2>
              {article.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{article.description}</p> : null}
              <p className="mt-4 text-xs text-[var(--text-muted)]">Disimpan {formatDate(article.createdAt)}</p>
            </div>
            <Button
              variant="secondary"
              disabled={actionPending}
              onClick={() => onDetach(article.id)}
            >
              <TagIcon className="size-4" aria-hidden="true" />
              {actionPending ? "Melepas…" : "Lepas tag"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

type ArticleTagManagerProps = {
  article: ArticleSummary;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError?: unknown;
  actionPending?: boolean;
  onTagChange: (input: ArticleTagAction) => Promise<unknown>;
};

// Mengelola attach dan detach tag dari quick action artikel tanpa optimistic data yang tidak dapat di-rollback.
export function ArticleTagManager({ article, tags, tagsLoading, tagsError, actionPending = false, onTagChange }: ArticleTagManagerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Membuka pengelola tag dengan relasi yang benar-benar berasal dari artikel aktif.
  function openManager() {
    setSelectedTagIds(article.tags?.map((tag) => tag.id) ?? []);
    setFeedback(null);
    setOpen(true);
  }

  // Memanggil mutation attach atau detach dan memperbarui pilihan hanya setelah server berhasil.
  async function handleToggle(tagId: string) {
    if (pendingTagId || actionPending) return;
    const isAttached = selectedTagIds.includes(tagId);
    const action = isAttached ? "detach" : "attach";
    setPendingTagId(tagId);
    setFeedback(null);
    try {
      await onTagChange({ articleId: article.id, tagId, action });
      setSelectedTagIds((current) => isAttached ? current.filter((currentId) => currentId !== tagId) : [...current, tagId]);
      setFeedback(action === "attach" ? "Tag dipasang." : "Tag dilepas.");
    } catch (error) {
      setFeedback(getTagMutationErrorMessage(error, action));
    } finally {
      setPendingTagId(null);
    }
  }

  const dialogBusy = Boolean(pendingTagId) || actionPending;

  return (
    <>
      <Button variant="ghost" className="min-h-10" disabled={actionPending} onClick={openManager}>
        <TagIcon className="size-4" aria-hidden="true" />Kelola tag
      </Button>
      <Dialog
        open={open}
        title="Kelola tag artikel"
        titleId={`article-tag-dialog-${article.id}`}
        description="Pilih tag yang ingin dipasang. Setiap perubahan disimpan melalui API."
        onClose={() => {
          if (!dialogBusy) setOpen(false);
        }}
        size="wide"
      >
        <TagPicker
          tags={tags}
          selectedTagIds={selectedTagIds}
          isLoading={tagsLoading}
          error={tagsError}
          disabled={dialogBusy}
          label="Tag artikel"
          onToggle={(tagId) => void handleToggle(tagId)}
        />
        {feedback ? <p className="mt-4 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">{feedback}</p> : null}
        {!tagsLoading && !tagsError && tags.length === 0 ? <Link className="mt-4 inline-flex font-semibold underline underline-offset-4" to="/tags" onClick={() => setOpen(false)}>Buat tag dari halaman Tag</Link> : null}
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" disabled={dialogBusy} onClick={() => setOpen(false)}>Selesai</Button>
        </div>
      </Dialog>
    </>
  );
}
