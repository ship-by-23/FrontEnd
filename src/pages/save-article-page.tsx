import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookmarkPlus, CheckCircle2, LoaderCircle, RotateCcw, Tag as TagIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form-controls";
import { getTags, createArticle, getArticle, readArticleReference, retryArticle, unwrapArticle, unwrapTags, type CreateArticleInput } from "../features/articles/article-api";
import {
  EXTRACTION_POLL_INITIAL_DELAY_MS,
  EXTRACTION_POLL_MAX_DELAY_MS,
  EXTRACTION_POLL_TIMEOUT_MS,
  getExtractionErrorMessage,
  getExtractionStatusLabel,
  getSaveArticleErrorMessage,
  isExtractionPending,
  isRetryablePollingError,
  validateArticleUrl,
} from "../features/articles/article-utils";
import type { ExtractionStatus, Tag } from "../lib/api/types";

type TagSelectorProps = {
  tags: Tag[];
  selectedTagIds: string[];
  isLoading: boolean;
  error: unknown;
  onToggle: (tagId: string) => void;
};

type ExtractionStatusPanelProps = {
  status: ExtractionStatus | null;
  errorCode?: string | null;
  pollingMessage: string | null;
  pollingTimedOut: boolean;
  pollingStopped: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  onResumePolling: () => void;
};

// Menampilkan pilihan tag yang tersedia tanpa mengisi database dengan tag contoh.
function TagSelector({ tags, selectedTagIds, isLoading, error, onToggle }: TagSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="flex items-center gap-2 text-sm font-semibold"><TagIcon className="size-4" aria-hidden="true" />Tag opsional</legend>
      {isLoading ? <p className="text-sm text-[var(--text-muted)]" role="status">Memuat tag…</p> : null}
      {!isLoading && error ? <p className="text-sm text-[var(--warning)]" role="status">Tag tidak dapat dimuat. Artikel tetap dapat disimpan tanpa tag.</p> : null}
      {!isLoading && !error && tags.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Belum ada tag. Artikel tetap dapat disimpan tanpa tag.</p> : null}
      {!isLoading && !error && tags.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {tags.map((tag) => (
            <label key={tag.id} className="flex min-h-11 items-center gap-3 border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]">
              <input
                type="checkbox"
                value={tag.id}
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => onToggle(tag.id)}
                className="size-4 accent-[var(--text)]"
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

// Menjelaskan lifecycle extraction berdasarkan status backend tanpa membuat persentase atau langkah palsu.
function ExtractionStatusPanel({
  status,
  errorCode,
  pollingMessage,
  pollingTimedOut,
  pollingStopped,
  isRetrying,
  onRetry,
  onResumePolling,
}: ExtractionStatusPanelProps) {
  const failed = status === "failed";
  const completed = status === "completed";
  const pollingHalted = (pollingTimedOut || pollingStopped) && !failed && !completed;

  return (
    <section className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6" aria-live="polite" aria-busy={isExtractionPending(status) && !pollingHalted}>
      <div className="flex items-start gap-3">
        {failed || pollingHalted ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--warning)]" aria-hidden="true" /> : completed ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--success)]" aria-hidden="true" /> : <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-[var(--text-muted)]" aria-hidden="true" />}
        <div className="min-w-0">
          <h2 className="font-semibold">{pollingHalted ? "Pemantauan berhenti" : getExtractionStatusLabel(status)}</h2>
          {failed ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{getExtractionErrorMessage(errorCode)}</p> : null}
          {pollingHalted ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Status belum terminal dan pemantauan dihentikan sementara. Tidak ada progress buatan yang ditampilkan.</p> : null}
          {isExtractionPending(status) && !pollingHalted ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Status akan diperbarui dari backend sampai proses selesai atau gagal.</p> : null}
          {pollingMessage ? <p className="mt-3 text-sm text-[var(--warning)]" role="status">{pollingMessage}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {failed ? <Button type="button" variant="secondary" disabled={isRetrying} onClick={onRetry}><RotateCcw className="size-4" aria-hidden="true" />{isRetrying ? "Mencoba lagi…" : "Coba ekstraksi lagi"}</Button> : null}
            {pollingHalted ? <Button type="button" variant="secondary" onClick={onResumePolling}><RotateCcw className="size-4" aria-hidden="true" />Pantau lagi</Button> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// Menampilkan form penyimpanan URL dan memantau extraction sampai terminal state secara bounded.
export function SaveArticlePage() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [trackedArticleId, setTrackedArticleId] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<ExtractionStatus | null>(null);
  const [pollingMessage, setPollingMessage] = useState<string | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [pollingRun, setPollingRun] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => getTags(signal),
  });

  const articleQuery = useQuery({
    queryKey: ["article", trackedArticleId],
    queryFn: ({ signal }) => getArticle(trackedArticleId ?? "", signal),
    enabled: false,
    retry: (failureCount, error) => failureCount < 2 && isRetryablePollingError(error),
    refetchOnWindowFocus: false,
  });
  const { refetch: refetchArticle } = articleQuery;

  // Mengawali atau mengulang pemantauan dengan menghapus detail cached agar status lama tidak tampil sebagai status baru.
  function startTracking(articleId: string, status: ExtractionStatus | undefined) {
    queryClient.removeQueries({ queryKey: ["article", articleId], exact: true });
    setTrackedArticleId(articleId);
    setCreatedStatus(status ?? "pending");
    setPollingMessage(null);
    setPollingTimedOut(false);
    setPollingStopped(false);
    setPollingRun((current) => current + 1);
  }

  const createMutation = useMutation({
    mutationFn: async (input: CreateArticleInput) => {
      const response = await createArticle(input);
      const reference = readArticleReference(response);
      if (!reference) throw new Error("Response penyimpanan artikel tidak memiliki ID artikel.");
      return reference;
    },
    onSuccess: (reference) => startTracking(reference.articleId, reference.extractionStatus),
  });

  const retryMutation = useMutation({
    mutationFn: async ({ articleId }: { articleId: string }) => ({
      articleId,
      response: await retryArticle(articleId),
    }),
    onSuccess: ({ articleId, response }) => {
      const reference = readArticleReference(response);
      startTracking(reference?.articleId ?? articleId, reference?.extractionStatus ?? "pending");
    },
  });

  useEffect(() => {
    if (!trackedArticleId || pollingRun === 0) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let delay = EXTRACTION_POLL_INITIAL_DELAY_MS;
    const deadline = Date.now() + EXTRACTION_POLL_TIMEOUT_MS;

    // Mengambil status artikel ulang dengan backoff yang meningkat dan batas waktu yang pasti.
    async function pollArticle() {
      if (cancelled) return;
      const result = await refetchArticle();
      if (cancelled) return;

      if (result.data) {
        const article = unwrapArticle(result.data);
        setCreatedStatus(article.extractionStatus);
        if (article.extractionStatus === "completed") {
          await queryClient.invalidateQueries({ queryKey: ["articles"] });
          navigate(`/articles/${article.id}`, { replace: true });
          return;
        }
        if (article.extractionStatus === "failed") return;
      }

      if (result.error && !isRetryablePollingError(result.error)) {
        setPollingMessage(getSaveArticleErrorMessage(result.error));
        setPollingStopped(true);
        return;
      }
      if (result.error) setPollingMessage("Koneksi sempat terganggu. Mencoba kembali secara terbatas…");

      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setPollingTimedOut(true);
        setPollingStopped(true);
        setPollingMessage("Batas pemantauan tercapai. Kamu dapat memulai pemantauan lagi.");
        return;
      }

      timeoutId = window.setTimeout(() => void pollArticle(), Math.min(delay, remaining));
      delay = Math.min(delay * 2, EXTRACTION_POLL_MAX_DELAY_MS);
    }

    void pollArticle();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [navigate, pollingRun, queryClient, refetchArticle, trackedArticleId]);

  const article = articleQuery.data ? unwrapArticle(articleQuery.data) : null;
  const status = article?.extractionStatus ?? createdStatus;
  const extractionErrorCode = article?.extractionErrorCode;
  const formError = createMutation.error ? getSaveArticleErrorMessage(createMutation.error) : null;
  const retryError = retryMutation.error ? getSaveArticleErrorMessage(retryMutation.error) : null;

  // Menyimpan perubahan URL dan membersihkan error input yang sudah diperbaiki user.
  function handleUrlChange(value: string) {
    setUrl(value);
    setClientError(null);
    createMutation.reset();
  }

  // Menjaga daftar tag terpilih tetap unik dan dapat dilepas kembali dari form.
  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => current.includes(tagId) ? current.filter((currentId) => currentId !== tagId) : [...current, tagId]);
  }

  // Mengirim URL yang lolos validasi dasar tanpa mengklaim telah melakukan validasi security backend.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = url.trim();
    const validationError = validateArticleUrl(normalizedUrl);
    setClientError(validationError);
    if (validationError || createMutation.isPending || retryMutation.isPending) return;

    setTrackedArticleId(null);
    setCreatedStatus(null);
    setPollingMessage(null);
    setPollingTimedOut(false);
    setPollingStopped(false);
    const input: CreateArticleInput = selectedTagIds.length > 0 ? { url: normalizedUrl, tagIds: selectedTagIds } : { url: normalizedUrl };
    createMutation.mutate(input);
  }

  // Mengulang extraction hanya ketika backend sudah menyatakan artikel gagal.
  function handleRetry() {
    if (!trackedArticleId || status !== "failed" || retryMutation.isPending) return;
    retryMutation.mutate({ articleId: trackedArticleId });
  }

  // Menjalankan ulang polling terhadap artikel yang masih berada pada state non-terminal.
  function handleResumePolling() {
    if (!trackedArticleId || !isExtractionPending(status) || (!pollingTimedOut && !pollingStopped)) return;
    startTracking(trackedArticleId, status ?? "pending");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Artikel baru</p>
      <h1 className="font-editorial mt-2 text-5xl font-semibold">Simpan untuk nanti</h1>
      <p className="mt-4 leading-7 text-[var(--text-muted)]">Tempel URL artikel publik. SimpanDulu akan mengambil dan membersihkan isinya untuk pengalaman membaca yang lebih tenang.</p>

      <form onSubmit={handleSubmit} className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" noValidate aria-busy={createMutation.isPending || retryMutation.isPending}>
        <div className="grid gap-6">
          <Field label="URL artikel" htmlFor="article-url" error={clientError ?? undefined}>
            <Input
              id="article-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://contoh.com/artikel"
              required
              value={url}
              aria-invalid={Boolean(clientError)}
              aria-describedby={clientError ? "article-url-error" : undefined}
              onChange={(event) => handleUrlChange(event.target.value)}
            />
          </Field>
          <TagSelector tags={tagsQuery.data ? unwrapTags(tagsQuery.data) : []} selectedTagIds={selectedTagIds} isLoading={tagsQuery.isPending} error={tagsQuery.error} onToggle={toggleTag} />
        </div>

        {formError ? <p className="mt-5 border-l-2 border-[var(--danger)] pl-3 text-sm leading-6 text-[var(--danger)]" role="alert">{formError}</p> : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <Button type="submit" disabled={createMutation.isPending || retryMutation.isPending}><BookmarkPlus className="size-4" aria-hidden="true" />{createMutation.isPending ? "Menyimpan…" : "Simpan artikel"}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Batal</Button>
        </div>
      </form>

      {trackedArticleId ? <ExtractionStatusPanel status={status} errorCode={extractionErrorCode} pollingMessage={retryError ?? pollingMessage} pollingTimedOut={pollingTimedOut} pollingStopped={pollingStopped} isRetrying={retryMutation.isPending} onRetry={handleRetry} onResumePolling={handleResumePolling} /> : null}

      <p className="mt-6 text-sm text-[var(--text-muted)]">Dengan menyimpan URL, kamu memastikan halaman tersebut boleh kamu akses. <Link to="/settings/bookmarklet" className="font-semibold underline">Pelajari bookmarklet</Link>.</p>
    </div>
  );
}
