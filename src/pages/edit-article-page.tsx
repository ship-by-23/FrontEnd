import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ErrorState } from "../components/feedback/states";
import {
  ArticleReadonlyMetadata,
  DeleteArticleDialog,
  EditArticleForm,
} from "../features/articles/edit-article-components";
import {
  getInitialEditArticleValues,
  getEditArticleLoadErrorMessage,
  getEditArticleMutationErrorMessage,
  toArticleUpdateInput,
  validateEditArticleValues,
  type EditArticleValues,
} from "../features/articles/edit-article-utils";
import { getArticle, unwrapArticle } from "../features/articles/article-api";
import { attachArticleTag, detachArticleTag, getTags, unwrapTags } from "../features/tags/tags-api";
import { getTagMutationErrorMessage } from "../features/tags/tags-utils";
import { deleteArticle, updateArticle } from "../features/library/library-api";

// Menjaga bentuk halaman edit tetap stabil selama detail artikel sedang dimuat.
function EditArticleSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6" role="status" aria-label="Memuat editor artikel">
      <div className="h-8 w-40 animate-pulse bg-[var(--surface-muted)]" aria-hidden="true" />
      <div className="h-12 max-w-xl animate-pulse bg-[var(--surface-muted)]" aria-hidden="true" />
      <div className="h-64 animate-pulse border border-[var(--border-muted)] bg-[var(--surface)]" aria-hidden="true" />
      <div className="h-80 animate-pulse border border-[var(--border-muted)] bg-[var(--surface)]" aria-hidden="true" />
      <span className="sr-only">Memuat metadata dan state artikel…</span>
    </div>
  );
}

// Menampilkan error detail artikel dengan pesan publik dan navigasi kembali ke library.
function EditArticleLoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <ErrorState title="Editor artikel tidak dapat dibuka" message={message} onRetry={onRetry} />
      <Link to="/library" className="mt-4 inline-flex min-h-11 items-center gap-2 border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--surface-muted)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke library
      </Link>
    </div>
  );
}

// Menyimpan state user-controlled dan memperbarui cache detail/list tanpa mengarang response API.
export function EditArticlePage() {
  const { articleId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<EditArticleValues | null>(null);
  const [syncedVersion, setSyncedVersion] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const [tagFeedback, setTagFeedback] = useState<string | null>(null);

  const articleQuery = useQuery({
    queryKey: ["article", articleId],
    queryFn: ({ signal }) => getArticle(articleId, signal),
    enabled: Boolean(articleId),
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => getTags(signal),
  });
  const article = articleQuery.data ? unwrapArticle(articleQuery.data) : null;
  const tags = tagsQuery.data ? unwrapTags(tagsQuery.data) : [];

  useEffect(() => {
    if (!article) return;
    const articleVersion = article.updatedAt ?? article.createdAt;
    if (formValues !== null && (isDirty || syncedVersion === articleVersion)) return;

    const frameId = window.requestAnimationFrame(() => {
      setFormValues(getInitialEditArticleValues(article));
      setSyncedVersion(articleVersion);
      setIsDirty(false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [article, formValues, isDirty, syncedVersion]);

  const updateMutation = useMutation({
    mutationFn: (values: EditArticleValues) => updateArticle(articleId, toArticleUpdateInput(values)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["article", articleId] }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
      setIsDirty(false);
      toast.success("Perubahan artikel tersimpan.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(articleId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["article", articleId] });
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDeleteOpen(false);
      toast.success("Artikel dihapus dari library.");
      navigate("/library", { replace: true });
    },
  });

  // Mengubah draft state lokal dan membuang error mutation lama ketika user mencoba lagi.
  function handleFormChange(input: Partial<Pick<EditArticleValues, "readingStatus" | "isFavorite" | "isArchived">>) {
    updateMutation.reset();
    setValidationError(null);
    setFormValues((current) => current ? { ...current, ...input } : current);
    setIsDirty(true);
  }

  // Mengirim state artikel yang sudah divalidasi tanpa memasukkan metadata extraction ke payload.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formValues || !articleId || updateMutation.isPending || deleteMutation.isPending || pendingTagId) return;

    const nextValidationError = validateEditArticleValues(formValues);
    setValidationError(nextValidationError);
    if (nextValidationError) return;

    updateMutation.mutate(formValues);
  }

  // Menyimpan satu perubahan relasi tag setelah endpoint attach atau detach berhasil.
  async function handleTagToggle(tagId: string) {
    if (!articleId || !formValues || pendingTagId || updateMutation.isPending || deleteMutation.isPending) return;

    const attached = formValues.tagIds.includes(tagId);
    setPendingTagId(tagId);
    setTagFeedback(null);
    try {
      if (attached) await detachArticleTag(articleId, tagId);
      else await attachArticleTag(articleId, tagId);

      setFormValues((current) => current ? {
        ...current,
        tagIds: attached ? current.tagIds.filter((currentTagId) => currentTagId !== tagId) : [...current.tagIds, tagId],
      } : current);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["article", articleId] }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
      setTagFeedback(attached ? "Tag dilepas." : "Tag dipasang.");
    } catch (error) {
      setTagFeedback(getTagMutationErrorMessage(error, attached ? "detach" : "attach"));
    } finally {
      setPendingTagId(null);
    }
  }

  // Membuka dialog delete setelah form tidak sedang mengirim mutation lain.
  function requestDelete() {
    if (!article || updateMutation.isPending || deleteMutation.isPending || pendingTagId) return;
    setDeleteOpen(true);
  }

  // Menghapus artikel setelah konfirmasi dan membiarkan dialog menampilkan error jika request gagal.
  async function confirmDelete() {
    if (!articleId || deleteMutation.isPending) return;
    await deleteMutation.mutateAsync();
  }

  if (!articleId) return <EditArticleLoadError message="ID artikel tidak valid." />;
  if (articleQuery.isPending) return <EditArticleSkeleton />;
  if (articleQuery.isError) return <EditArticleLoadError message={getEditArticleLoadErrorMessage(articleQuery.error)} onRetry={() => void articleQuery.refetch()} />;
  if (!article) return <EditArticleLoadError message="Artikel tidak ditemukan atau response server tidak lengkap." />;
  if (!formValues) return <EditArticleSkeleton />;

  const mutationError = updateMutation.error ? getEditArticleMutationErrorMessage(updateMutation.error, "update") : null;
  const errorMessage = validationError ?? mutationError;
  const controlsBusy = updateMutation.isPending || deleteMutation.isPending || Boolean(pendingTagId);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={`/articles/${article.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke artikel
      </Link>
      <header className="mt-6 border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan artikel</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Pencil className="size-6" aria-hidden="true" />
          <h1 className="font-editorial text-5xl font-semibold">Edit artikel</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Kelola state artikel tanpa mengubah metadata hasil ekstraksi secara diam-diam.</p>
      </header>

      <div className="mt-8 grid gap-6">
        <ArticleReadonlyMetadata article={article} />
        <EditArticleForm
          values={formValues}
          tags={tags}
          tagsAvailable={Array.isArray(article.tags)}
          tagsLoading={tagsQuery.isPending}
          tagsError={tagsQuery.error}
          isSaving={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          tagActionPending={Boolean(pendingTagId)}
          errorMessage={errorMessage}
          tagFeedback={tagFeedback}
          onChange={handleFormChange}
          onTagToggle={(tagId) => void handleTagToggle(tagId)}
          onSubmit={handleSubmit}
          onDelete={requestDelete}
        />
      </div>

      <DeleteArticleDialog
        article={deleteOpen ? article : null}
        error={deleteMutation.error}
        isPending={deleteMutation.isPending || controlsBusy}
        onClose={() => {
          if (!controlsBusy) {
            setDeleteOpen(false);
            deleteMutation.reset();
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
