import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { getLibraryArticles } from "../features/library/library-api";
import { getLibraryErrorMessage } from "../features/library/library-utils";
import { forgetArticleTagOverride, rememberArticleTagChange } from "../features/tags/article-tag-cache";
import {
  createTag,
  deleteTag,
  detachArticleTag,
  getTags,
  renameTag,
  unwrapTags,
} from "../features/tags/tags-api";
import {
  CreateTagDialog,
  DeleteTagDialog,
  RenameTagDialog,
  TagArticleList,
  TagChip,
} from "../features/tags/tags-components";
import { getTagListErrorMessage, getTagMutationErrorMessage, parseTagPage, TAG_ARTICLES_PAGE_SIZE } from "../features/tags/tags-utils";
import type { Tag } from "../lib/api/types";

// Menjaga bentuk halaman Tags tetap stabil ketika daftar tag sedang dimuat.
function TagDirectorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Memuat direktori tag">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 border border-[var(--border-muted)] bg-[var(--surface)]" aria-hidden="true" />)}
    </div>
  );
}

// Menampilkan direktori tag beserta mutation CRUD yang berasal dari API nyata.
export function TagsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const queryClient = useQueryClient();
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: ({ signal }) => getTags(signal) });

  const createMutation = useMutation({
    mutationFn: (name: string) => createTag({ name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      setCreateOpen(false);
      toast.success("Tag berhasil dibuat.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) => renameTag(tagId, { name }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
      setRenameTarget(null);
      toast.success("Nama tag berhasil diubah.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: async () => {
      if (deleteTarget) forgetArticleTagOverride(deleteTarget.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]);
      setDeleteTarget(null);
      toast.success("Tag dihapus. Artikel tetap tersimpan.");
    },
  });

  const tags = tagsQuery.data ? unwrapTags(tagsQuery.data) : [];

  // Membuka create dialog sambil membersihkan error mutation sebelumnya.
  function openCreateDialog() {
    createMutation.reset();
    setCreateOpen(true);
  }

  // Membuka rename dialog untuk tag yang dipilih dari directory.
  function openRenameDialog(tag: Tag) {
    renameMutation.reset();
    setRenameTarget(tag);
  }

  // Membuka confirmation delete tanpa mengubah artikel secara langsung di client.
  function openDeleteDialog(tag: Tag) {
    deleteMutation.reset();
    setDeleteTarget(tag);
  }

  // Menjalankan mutation create dan membiarkan dialog menampilkan error backend jika gagal.
  async function handleCreate(name: string) {
    await createMutation.mutateAsync(name);
  }

  // Menjalankan mutation rename dengan ID tag yang dipilih user.
  async function handleRename(name: string) {
    if (!renameTarget) return;
    await renameMutation.mutateAsync({ tagId: renameTarget.id, name });
  }

  // Menjalankan mutation delete setelah user mengonfirmasi bahwa artikel tidak ikut terhapus.
  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Organisasi pribadi</p>
          <h1 className="font-editorial mt-1 text-5xl font-semibold">Tag</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Kelompokkan artikel tanpa memindahkan atau menggandakan isi bacaanmu.</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="size-4" aria-hidden="true" />Buat tag</Button>
      </header>

      <section className="mt-8" aria-label="Direktori tag">
        {tagsQuery.isPending ? <TagDirectorySkeleton /> : tagsQuery.isError ? <ErrorState message={getTagListErrorMessage(tagsQuery.error)} onRetry={() => void tagsQuery.refetch()} /> : tags.length === 0 ? (
          <EmptyState
            title="Belum ada tag"
            description="Buat tag pertama untuk mengelompokkan artikel berdasarkan topik atau kebutuhanmu."
            action={<Button onClick={openCreateDialog}><Plus className="size-4" aria-hidden="true" />Buat tag pertama</Button>}
          />
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <li key={tag.id} className="flex min-h-24 flex-col justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] p-4">
                  <TagChip tag={tag} href={`/tags/${tag.id}`} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="min-h-10 px-3" onClick={() => openRenameDialog(tag)}>
                      <Pencil className="size-4" aria-hidden="true" />Rename
                    </Button>
                    <Button variant="ghost" className="min-h-10 px-3 text-[var(--danger)] hover:bg-[color:var(--danger)]/10" onClick={() => openDeleteDialog(tag)}>
                      <Trash2 className="size-4" aria-hidden="true" />Hapus
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <CreateTagDialog
        open={createOpen}
        error={createMutation.error}
        isPending={createMutation.isPending}
        onClose={() => {
          if (!createMutation.isPending) setCreateOpen(false);
        }}
        onSubmit={handleCreate}
      />
      <RenameTagDialog
        open={Boolean(renameTarget)}
        initialName={renameTarget?.name}
        error={renameMutation.error}
        isPending={renameMutation.isPending}
        onClose={() => {
          if (!renameMutation.isPending) setRenameTarget(null);
        }}
        onSubmit={handleRename}
      />
      <DeleteTagDialog
        tag={deleteTarget}
        error={deleteMutation.error}
        isPending={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Menampilkan artikel yang memakai tag tertentu dengan pagination dan detach dari API.
export function TagDetailPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagActionError, setTagActionError] = useState<unknown>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const page = parseTagPage(searchParams.get("page"));
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: ({ signal }) => getTags(signal) });
  const tags = tagsQuery.data ? unwrapTags(tagsQuery.data) : [];
  const activeTag = tagId ? tags.find((tag) => tag.id === tagId) : undefined;
  const articleParams = { page, pageSize: TAG_ARTICLES_PAGE_SIZE, tagId: tagId ?? "" };
  const articlesQuery = useQuery({
    queryKey: ["articles", "tag", articleParams],
    queryFn: ({ signal }) => getLibraryArticles(articleParams, signal),
    enabled: Boolean(activeTag && tagId),
  });

  const detachMutation = useMutation({
    mutationFn: (articleId: string) => detachArticleTag(articleId, tagId ?? ""),
    onSuccess: async (_result, articleId) => {
      if (activeTag) rememberArticleTagChange(articleId, activeTag, "detach");
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      setTagActionError(null);
      toast.success("Tag dilepas dari artikel.");
    },
    onError: (error) => setTagActionError(error),
  });

  useEffect(() => {
    const totalPages = articlesQuery.data?.pagination.totalPages;
    if (totalPages === undefined) return;
    if (totalPages === 0 && page !== 1) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("page");
        return next;
      }, { replace: true });
      return;
    }
    if (totalPages > 0 && page > totalPages) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("page", String(totalPages));
        return next;
      }, { replace: true });
    }
  }, [articlesQuery.data?.pagination.totalPages, page, setSearchParams]);

  // Mengubah halaman artikel bertag tanpa kehilangan parameter URL lain.
  function changePage(nextPage: number) {
    if (nextPage < 1) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 1) next.delete("page");
      else next.set("page", String(nextPage));
      return next;
    });
  }

  // Melepas tag dari artikel yang dipilih tanpa menghapus artikel dari library.
  function handleDetach(articleId: string) {
    if (!tagId || detachMutation.isPending) return;
    setTagActionError(null);
    detachMutation.mutate(articleId);
  }

  if (tagsQuery.isPending) return <LoadingState label="Memuat detail tag…" />;
  if (tagsQuery.isError) return <ErrorState message={getTagListErrorMessage(tagsQuery.error)} onRetry={() => void tagsQuery.refetch()} />;
  if (!activeTag) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="Tag tidak ditemukan" message="Tag mungkin sudah dihapus atau tidak termasuk dalam akun ini." />
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/tags")}><ArrowLeft className="size-4" aria-hidden="true" />Kembali ke tag</Button>
      </div>
    );
  }

  const articles = articlesQuery.data?.data ?? [];
  const pagination = articlesQuery.data?.pagination;

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline" to="/tags"><ArrowLeft className="size-4" aria-hidden="true" />Semua tag</Link>
      <header className="mt-6 border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Artikel bertag</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TagIcon className="size-6" aria-hidden="true" />
          <h1 className="font-editorial text-5xl font-semibold break-words">{activeTag.name}</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Daftar artikel privat yang saat ini memakai tag ini.</p>
      </header>

      <section className="mt-8" aria-label={`Artikel dengan tag ${activeTag.name}`}>
        {articlesQuery.isPending ? <LoadingState label="Memuat artikel bertag…" /> : articlesQuery.isError ? <ErrorState message={getLibraryErrorMessage(articlesQuery.error)} onRetry={() => void articlesQuery.refetch()} /> : (
          <>
            {tagActionError ? <p className="mb-4 border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="alert">{getTagMutationErrorMessage(tagActionError, "detach")}</p> : null}
            <TagArticleList articles={articles} actionPending={detachMutation.isPending} onDetach={handleDetach} />
            {pagination && pagination.totalPages > 1 ? (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination artikel bertag">
                <Button variant="secondary" disabled={page <= 1 || detachMutation.isPending} onClick={() => changePage(page - 1)}>Sebelumnya</Button>
                <span className="text-sm text-[var(--text-muted)]">Halaman {page} dari {pagination.totalPages}</span>
                <Button variant="secondary" disabled={page >= pagination.totalPages || detachMutation.isPending} onClick={() => changePage(page + 1)}>Berikutnya</Button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
