import { Archive, ArchiveRestore, ExternalLink, Heart, Trash2, type LucideIcon } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Field, Select } from "../../components/ui/form-controls";
import { getExtractionErrorMessage, getExtractionStatusLabel } from "./article-utils";
import { TagPicker } from "../tags/tags-components";
import type { Article, ReadingStatus, Tag } from "../../lib/api/types";
import { getEditArticleMutationErrorMessage, type EditArticleValues } from "./edit-article-utils";
import { getSafeReaderSourceUrl } from "../reader/reader-utils";
import { formatDate } from "../../lib/utils";

type ArticleReadonlyMetadataProps = {
  article: Article;
};

// Menampilkan metadata extraction tanpa menyediakan input yang belum didukung contract override.
export function ArticleReadonlyMetadata({ article }: ArticleReadonlyMetadataProps) {
  const sourceUrl = getSafeReaderSourceUrl(article.canonicalUrl ?? article.submittedUrl);
  const extractionFailed = article.extractionStatus === "failed";

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" aria-labelledby="article-readonly-heading">
      <div className="flex flex-col gap-3 border-b border-[var(--border-muted)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Metadata hasil ekstraksi</p>
          <h2 id="article-readonly-heading" className="font-editorial mt-2 break-words text-4xl font-semibold leading-tight">
            {article.title ?? "Artikel tanpa judul"}
          </h2>
          {article.description ? <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">{article.description}</p> : null}
        </div>
        <span className={[
          "inline-flex min-h-8 shrink-0 items-center border px-2 py-1 text-xs font-semibold",
          extractionFailed ? "border-[var(--danger)] text-[var(--danger)]" : "border-[var(--border-muted)]",
        ].join(" ")}>
          {getExtractionStatusLabel(article.extractionStatus)}
        </span>
      </div>

      {extractionFailed ? (
        <p className="mt-5 border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="status">
          {getExtractionErrorMessage(article.extractionErrorCode)}
        </p>
      ) : null}

      <dl className="mt-6 grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[var(--text-muted)]">Situs</dt>
          <dd className="mt-1 break-words font-semibold">{article.siteName ?? "Tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Penulis</dt>
          <dd className="mt-1 break-words font-semibold">{article.author ?? "Tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Tanggal publikasi</dt>
          <dd className="mt-1 font-semibold">{formatDate(article.publishedAt)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Disimpan</dt>
          <dd className="mt-1 font-semibold">{formatDate(article.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Estimasi baca</dt>
          <dd className="mt-1 font-semibold">{article.estimatedReadingMinutes ? `${article.estimatedReadingMinutes} menit` : "Tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Jumlah kata</dt>
          <dd className="mt-1 font-semibold">{article.wordCount !== null && article.wordCount !== undefined ? article.wordCount.toLocaleString("id-ID") : "Tidak tersedia"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--text-muted)]">URL sumber</dt>
          <dd className="mt-1 break-all font-semibold">
            {sourceUrl ? (
              <a className="inline-flex items-center gap-1 underline underline-offset-4" href={sourceUrl} target="_blank" rel="noopener noreferrer">
                Buka sumber asli <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : "Tidak tersedia"}
          </dd>
        </div>
      </dl>

      <p className="mt-6 border-t border-[var(--border-muted)] pt-5 text-sm leading-6 text-[var(--text-muted)]">
        Metadata ini berasal dari halaman sumber dan tetap read-only sampai backend menetapkan contract override untuk title, description, atau cover.
      </p>
    </section>
  );
}

type StatusSelectProps = {
  value: ReadingStatus;
  disabled: boolean;
  onChange: (value: ReadingStatus) => void;
};

// Menyediakan pilihan status baca yang dibatasi pada enum produk.
export function StatusSelect({ value, disabled, onChange }: StatusSelectProps) {
  return (
    <Field label="Status baca" htmlFor="article-reading-status">
      <Select
        id="article-reading-status"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === "unread" || nextValue === "reading" || nextValue === "finished") onChange(nextValue);
        }}
      >
        <option value="unread">Belum dibaca</option>
        <option value="reading">Sedang dibaca</option>
        <option value="finished">Selesai</option>
      </Select>
    </Field>
  );
}

type StateToggleProps = {
  label: string;
  pressed: boolean;
  disabled: boolean;
  icon: LucideIcon;
  onClick: () => void;
};

// Merender toggle state dengan label dan aria-pressed agar status tidak hanya dibedakan melalui warna.
function StateToggle({ label, pressed, disabled, icon: Icon, onClick }: StateToggleProps) {
  return (
    <Button
      variant={pressed ? "secondary" : "ghost"}
      className="min-h-11 justify-start"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className={pressed ? "size-4 fill-current" : "size-4"} aria-hidden="true" />
      {label}
      <span className="sr-only">{pressed ? " aktif" : " tidak aktif"}</span>
    </Button>
  );
}

type EditArticleFormProps = {
  values: EditArticleValues;
  tags: Tag[];
  tagsAvailable: boolean;
  tagsLoading: boolean;
  tagsError?: unknown;
  isSaving: boolean;
  isDeleting: boolean;
  tagActionPending: boolean;
  errorMessage?: string | null;
  tagFeedback?: string | null;
  onChange: (input: Partial<Pick<EditArticleValues, "readingStatus" | "isFavorite" | "isArchived">>) => void;
  onTagToggle: (tagId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
};

// Menggabungkan state user-controlled dalam form sederhana tanpa membuat CMS editor.
export function EditArticleForm({
  values,
  tags,
  tagsAvailable,
  tagsLoading,
  tagsError,
  isSaving,
  isDeleting,
  tagActionPending,
  errorMessage,
  tagFeedback,
  onChange,
  onTagToggle,
  onSubmit,
  onDelete,
}: EditArticleFormProps) {
  const controlsDisabled = isSaving || isDeleting;

  return (
    <form className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" onSubmit={onSubmit} noValidate aria-busy={controlsDisabled}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">State yang dikontrol user</p>
        <h2 className="font-editorial mt-2 text-4xl font-semibold">Kelola artikel</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Perubahan status, favorit, dan arsip disimpan melalui endpoint artikel. Perubahan tag disimpan saat tag dipilih.</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <StatusSelect value={values.readingStatus} disabled={controlsDisabled} onChange={(readingStatus) => onChange({ readingStatus })} />
        <fieldset className="grid gap-2" disabled={controlsDisabled}>
          <legend className="text-sm font-semibold">Preferensi artikel</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <StateToggle
              label={values.isFavorite ? "Artikel favorit" : "Tambahkan ke favorit"}
              pressed={values.isFavorite}
              disabled={controlsDisabled}
              icon={Heart}
              onClick={() => onChange({ isFavorite: !values.isFavorite })}
            />
            <StateToggle
              label={values.isArchived ? "Artikel diarsipkan" : "Arsipkan artikel"}
              pressed={values.isArchived}
              disabled={controlsDisabled}
              icon={values.isArchived ? ArchiveRestore : Archive}
              onClick={() => onChange({ isArchived: !values.isArchived })}
            />
          </div>
        </fieldset>
      </div>

      <div className="mt-8 border-t border-[var(--border-muted)] pt-8">
        {tagsAvailable ? (
          <TagPicker
            tags={tags}
            selectedTagIds={values.tagIds}
            isLoading={tagsLoading}
            error={tagsError}
            disabled={controlsDisabled || tagActionPending}
            label="Tag artikel"
            onToggle={onTagToggle}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]" role="status">Relasi tag belum tersedia pada detail artikel ini, jadi perubahan tag dinonaktifkan.</p>
        )}
        {tagFeedback ? <p className="mt-3 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">{tagFeedback}</p> : null}
      </div>

      {errorMessage ? <p className="mt-8 border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="alert">{errorMessage}</p> : null}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--border-muted)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="danger" disabled={controlsDisabled || tagActionPending} onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" />
          Hapus permanen
        </Button>
        <Button type="submit" disabled={controlsDisabled || tagActionPending}>
          {isSaving ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}

type DeleteArticleDialogProps = {
  article: Article | null;
  error?: unknown;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

// Meminta konfirmasi eksplisit sebelum artikel dan seluruh data turunannya dihapus permanen.
export function DeleteArticleDialog({ article, error, isPending, onClose, onConfirm }: DeleteArticleDialogProps) {
  const errorMessage = error ? getEditArticleMutationErrorMessage(error, "delete") : null;

  // Menjalankan mutation delete hanya sekali dan mempertahankan dialog saat request gagal.
  async function handleConfirm() {
    if (isPending) return;
    try {
      await onConfirm();
    } catch {
      // Error mutation tetap ditampilkan dari prop tanpa menutup dialog atau menghapus draft.
    }
  }

  return (
    <Dialog
      open={Boolean(article)}
      title="Hapus artikel secara permanen?"
      titleId="edit-delete-article-dialog-title"
      description="Artikel, relasi tag, highlight, catatan, dan data ekstraksinya akan ikut dihapus. Tindakan ini tidak dapat dibatalkan."
      onClose={onClose}
    >
      {article ? (
        <div>
          <p className="break-words border-l-2 border-[var(--danger)] pl-3 font-semibold">{article.title ?? "Artikel tanpa judul"}</p>
          {errorMessage ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{errorMessage}</p> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" disabled={isPending} onClick={onClose}>Batal</Button>
            <Button variant="danger" disabled={isPending} onClick={() => void handleConfirm()}>{isPending ? "Menghapus…" : "Hapus permanen"}</Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
