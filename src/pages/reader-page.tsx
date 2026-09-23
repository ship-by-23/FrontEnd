import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { LoadingState } from "../components/feedback/states";
import {
  getArticle,
  markArticleFinished,
  retryArticle,
  saveReadingProgress,
  unwrapArticle,
  type ReadingProgressInput,
} from "../features/articles/article-api";
import { EXTRACTION_POLL_TIMEOUT_MS, getExtractionErrorMessage, getExtractionStatusLabel, isExtractionPending } from "../features/articles/article-utils";
import {
  ArticleMetadata,
  ProgressSaveStatus,
  ReaderErrorState,
  ReaderHeader,
  ReaderSkeleton,
  ReadingProgressBar,
} from "../features/reader/reader-components";
import { ReaderHighlights } from "../features/highlights/reader-highlights";
import { useAppearance } from "../features/appearance/appearance-context";
import {
  calculateReadingProgress,
  clampReadingProgress,
  findReaderAnchor,
  findVisibleReaderAnchor,
  getReaderErrorMessage,
  getScrollPositionForProgress,
  READER_PROGRESS_THROTTLE_MS,
} from "../features/reader/reader-utils";
import type { ArticleCollection } from "../lib/api/types";
import { cn } from "../lib/utils";

type ProgressSaveState = "idle" | "saving" | "saved" | "error";

// Menampilkan Reader dengan query detail, lifecycle extraction, theme lokal, dan progress persistence.
export function ReaderPage() {
  const { articleId = "" } = useParams();
  const queryClient = useQueryClient();
  const { preferences } = useAppearance();
  const { theme, readerFont, textSize } = preferences;
  const [visualProgress, setVisualProgress] = useState(0);
  const [progressSaveState, setProgressSaveState] = useState<ProgressSaveState>("idle");
  const [extractionPollingTimeoutKey, setExtractionPollingTimeoutKey] = useState<string | null>(null);
  const [extractionPollingAttempt, setExtractionPollingAttempt] = useState(0);
  const readerContentRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const readerBodyRef = useRef<HTMLElement | null>(null);
  const pendingProgressRef = useRef<ReadingProgressInput | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const progressInFlightRef = useRef<Promise<void> | null>(null);
  const lastProgressPersistedAtRef = useRef(0);
  const currentAnchorRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);
  const restoredArticleIdRef = useRef<string | null>(null);
  const flushProgressRef = useRef<() => Promise<void>>(async () => undefined);
  const flushProgressNowRef = useRef<() => Promise<void>>(async () => undefined);
  const updateReadingProgressRef = useRef<() => void>(() => undefined);
  const extractionPollingKey = articleId ? `${articleId}:${extractionPollingAttempt}` : null;
  const extractionPollingTimedOut = extractionPollingKey !== null && extractionPollingTimeoutKey === extractionPollingKey;

  useEffect(() => {
    scrollContainerRef.current = document.querySelector<HTMLElement>("[data-app-scroll-container]");
    return () => {
      scrollContainerRef.current = null;
    };
  }, []);

  const getActiveScrollContainer = useCallback(() => {
    const candidate = scrollContainerRef.current;
    if (!candidate) return null;
    const overflowY = window.getComputedStyle(candidate).overflowY;
    return overflowY === "auto" || overflowY === "scroll" ? candidate : null;
  }, []);

  const getScrollMetrics = useCallback(() => {
    const scrollContainer = getActiveScrollContainer();
    if (!scrollContainer) {
      return {
        scrollContainer: null,
        scrollOffset: window.scrollY,
        viewportHeight: window.innerHeight,
        viewportTop: 0,
      };
    }

    return {
      scrollContainer,
      scrollOffset: scrollContainer.scrollTop,
      viewportHeight: scrollContainer.clientHeight || window.innerHeight,
      viewportTop: scrollContainer.getBoundingClientRect().top,
    };
  }, [getActiveScrollContainer]);

  const articleQuery = useQuery({
    queryKey: ["article", articleId],
    queryFn: ({ signal }) => getArticle(articleId, signal),
    enabled: Boolean(articleId),
    refetchInterval: (query) => {
      const article = query.state.data ? unwrapArticle(query.state.data) : null;
      return !extractionPollingTimedOut && article && isExtractionPending(article.extractionStatus) ? 2_500 : false;
    },
    refetchOnWindowFocus: false,
  });

  const finishMutation = useMutation({
    mutationFn: () => markArticleFinished(articleId),
    onSuccess: async () => {
      setVisualProgress(100);
      await queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Artikel ditandai selesai.");
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryArticle(articleId),
    onSuccess: async () => {
      setExtractionPollingAttempt((current) => current + 1);
      await queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      toast.success("Artikel sedang disiapkan lagi.");
    },
  });

  const article = articleQuery.data ? unwrapArticle(articleQuery.data) : null;
  const extractionStatus = article?.extractionStatus;

  useEffect(() => {
    if (!article?.id || !extractionPollingKey || !isExtractionPending(extractionStatus)) return;
    const timeoutId = window.setTimeout(() => {
      setExtractionPollingTimeoutKey(extractionPollingKey);
    }, EXTRACTION_POLL_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [article?.id, extractionPollingKey, extractionStatus]);

  // Mengirim progress terbaru setelah interval throttle atau ketika browser perlu melakukan flush.
  async function flushProgress() {
    const activeRequest = progressInFlightRef.current;
    if (activeRequest) return activeRequest;

    const snapshot = pendingProgressRef.current;
    if (!articleId || !snapshot) return;

    pendingProgressRef.current = null;
    setProgressSaveState("saving");
    const request = (async () => {
      try {
        await saveReadingProgress(articleId, snapshot);
        lastProgressPersistedAtRef.current = Date.now();
        setProgressSaveState("saved");
        queryClient.setQueriesData<ArticleCollection>({ queryKey: ["articles"] }, (current) => {
          if (!current) return current;

          return {
            ...current,
            data: current.data.map((item) => {
              if (item.id !== articleId) return item;

              const nextProgress = snapshot.readingProgress;
              const nextStatus = nextProgress > 0 && item.readingStatus === "unread" ? "reading" : item.readingStatus;
              const nextAnchor = snapshot.readingAnchor === undefined ? item.readingAnchor : snapshot.readingAnchor;
              return {
                ...item,
                readingProgress: nextProgress,
                readingAnchor: nextAnchor,
                readingStatus: nextStatus,
              };
            }),
          };
        });
        // Tandai cache library stale agar kartu membaca ulang progress terbaru saat user kembali.
        void queryClient.invalidateQueries({ queryKey: ["articles"] });
      } catch {
        pendingProgressRef.current = pendingProgressRef.current ?? snapshot;
        setProgressSaveState("error");
      } finally {
        progressInFlightRef.current = null;
        if (pendingProgressRef.current && progressTimerRef.current === null) {
          progressTimerRef.current = window.setTimeout(() => {
            progressTimerRef.current = null;
            void flushProgressRef.current();
          }, READER_PROGRESS_THROTTLE_MS);
        }
      }
    })();

    progressInFlightRef.current = request;
    return request;
  }

  // Menjadwalkan hanya snapshot terakhir agar scroll event tidak menjadi request API per event.
  function scheduleProgressSave(snapshot: ReadingProgressInput) {
    pendingProgressRef.current = snapshot;
    if (progressTimerRef.current !== null || progressInFlightRef.current) return;

    const elapsed = Date.now() - lastProgressPersistedAtRef.current;
    const delay = Math.max(0, READER_PROGRESS_THROTTLE_MS - elapsed);
    progressTimerRef.current = window.setTimeout(() => {
      progressTimerRef.current = null;
      void flushProgressRef.current();
    }, delay);
  }

  // Menghentikan timer lalu mengirim snapshot yang menunggu sebelum route atau visibility berubah.
  function flushProgressNow() {
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    return flushProgress();
  }

  // Menghitung progress visual dan menyimpan anchor stabil bila HTML backend menyediakannya.
  function updateReadingProgress() {
    const container = readerContentRef.current;
    if (!container || !readerBodyRef.current || article?.readingStatus === "finished") return;

    const { scrollOffset, viewportHeight, viewportTop } = getScrollMetrics();
    const progress = calculateReadingProgress(container, scrollOffset, viewportHeight, viewportTop);
    setVisualProgress((current) => current === progress ? current : progress);
    if (isRestoringRef.current) return;

    const visibleAnchor = findVisibleReaderAnchor(readerBodyRef.current, viewportHeight, viewportTop);
    if (visibleAnchor) currentAnchorRef.current = visibleAnchor;
    scheduleProgressSave({
      readingProgress: progress,
      readingAnchor: currentAnchorRef.current,
    });
  }

  useEffect(() => {
    flushProgressRef.current = flushProgress;
    flushProgressNowRef.current = flushProgressNow;
    updateReadingProgressRef.current = updateReadingProgress;
  });

  // Menghidupkan kembali polling extraction setelah batas pemantauan otomatis tercapai.
  function resumeExtractionPolling() {
    if (!article || !isExtractionPending(article.extractionStatus)) return;
    setExtractionPollingAttempt((current) => current + 1);
    void articleQuery.refetch();
  }

  // Menunggu progress terakhir lalu mengirim mutation mark finished tanpa membiarkan queue lama menimpa progress 100.
  async function handleMarkFinished() {
    if (finishMutation.isPending || !articleId) return;
    await flushProgressNow();
    if (pendingProgressRef.current) await flushProgressNow();
    pendingProgressRef.current = null;
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    finishMutation.mutate();
  }

  useEffect(() => {
    if (!article || article.extractionStatus !== "completed" || restoredArticleIdRef.current === article.id) return;
    const container = readerContentRef.current;
    if (!container) return;

    restoredArticleIdRef.current = article.id;
    currentAnchorRef.current = article.readingAnchor ?? null;
    setVisualProgress(article.readingStatus === "finished" ? 100 : clampReadingProgress(article.readingProgress ?? 0));

    const frameId = window.requestAnimationFrame(() => {
      const currentContainer = readerContentRef.current;
      if (!currentContainer) return;

      isRestoringRef.current = true;
      const anchorElement = findReaderAnchor(readerBodyRef.current ?? currentContainer, article.readingAnchor);
      if (anchorElement) {
        anchorElement.scrollIntoView({ block: "start", behavior: "auto" });
      } else if (article.readingProgress !== null && article.readingProgress !== undefined) {
        const { scrollContainer, scrollOffset, viewportHeight, viewportTop } = getScrollMetrics();
        const top = getScrollPositionForProgress(currentContainer, article.readingProgress, viewportHeight, scrollOffset, viewportTop);
        if (scrollContainer) scrollContainer.scrollTo({ top, behavior: "auto" });
        else window.scrollTo({ top, behavior: "auto" });
      }

      window.requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [article, getScrollMetrics]);

  useEffect(() => {
    if (!article || article.extractionStatus !== "completed") return;

    let frameId: number | null = null;
    const scrollContainer = getActiveScrollContainer();
    const scrollTarget: Window | HTMLElement = scrollContainer ?? window;
    const handleScrollOrResize = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateReadingProgressRef.current();
      });
    };

    handleScrollOrResize();
    scrollTarget.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      scrollTarget.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [article, getActiveScrollContainer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushProgressNowRef.current();
    };
    const handlePageHide = () => {
      void flushProgressNowRef.current();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      void flushProgressNowRef.current();
    };
  }, []);

  if (!articleId) return <ReaderErrorState message="ID artikel tidak valid." />;
  if (articleQuery.isPending) {
    return <div className="-m-4 min-h-[calc(100vh-4rem)] bg-[var(--surface)] p-4 sm:-m-6 sm:p-8 lg:-m-10 lg:p-12"><ReaderSkeleton /></div>;
  }
  if (articleQuery.isError) return <ReaderErrorState message={getReaderErrorMessage(articleQuery.error)} onRetry={() => void articleQuery.refetch()} />;
  if (!article) return <ReaderErrorState message="Artikel tidak ditemukan atau belum dapat dimuat." />;

  if (isExtractionPending(article.extractionStatus)) {
    if (extractionPollingTimedOut) {
      return (
        <ReaderErrorState
          title="Artikel belum siap dibaca"
          message="Proses penyiapan membutuhkan waktu lebih lama. Coba periksa lagi beberapa saat."
          onRetry={resumeExtractionPolling}
        />
      );
    }

    return (
      <div className="mx-auto max-w-2xl">
        <LoadingState label={`${getExtractionStatusLabel(article.extractionStatus)}. Halaman akan diperbarui otomatis…`} />
      </div>
    );
  }

  if (article.extractionStatus === "failed") {
    const retryError = retryMutation.error ? getReaderErrorMessage(retryMutation.error) : null;
    return (
      <ReaderErrorState
        title="Artikel belum siap dibaca"
        message={retryError ?? getExtractionErrorMessage(article.extractionErrorCode)}
        onRetry={retryMutation.isPending ? undefined : () => retryMutation.mutate()}
      />
    );
  }

  const dark = theme === "dark";
  return (
    <div className={cn(
      "-m-4 min-h-[calc(100vh-4rem)] p-4 transition-colors sm:-m-6 sm:p-8 lg:-m-10 lg:p-12",
      dark ? "bg-[var(--reader-dark)] text-[var(--reader-dark-text)]" : "bg-[var(--surface)] text-[var(--text)]",
    )}>
      <ReadingProgressBar progress={visualProgress} dark={dark} />
      <div ref={readerContentRef} className="mx-auto max-w-3xl">
        <ReaderHeader
          dark={dark}
          isFinished={article.readingStatus === "finished"}
          isMarkingFinished={finishMutation.isPending || progressSaveState === "saving"}
          onMarkFinished={() => void handleMarkFinished()}
        />
        <div className="mt-3 flex min-h-5 justify-end">
          <ProgressSaveStatus state={progressSaveState} />
        </div>
        {finishMutation.error ? <p className="mt-3 border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="alert">{getReaderErrorMessage(finishMutation.error)}</p> : null}
        <ArticleMetadata article={article} />
        <ReaderHighlights article={article} dark={dark} readerFont={readerFont} textSize={textSize} bodyRef={readerBodyRef} />
      </div>
    </div>
  );
}
