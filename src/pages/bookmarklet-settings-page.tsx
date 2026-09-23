import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkletSetupCard, BrowserInstructions, InstallInstructions, type BookmarkletFeedback } from "../features/bookmarklet/bookmarklet-components";
import { buildSaveArticleUrl, createBookmarkletSource } from "../features/bookmarklet/bookmarklet-utils";
import { SettingsNavigation } from "../features/settings/settings-navigation";

// Menyalin source bookmarklet atau memilihnya sebagai fallback ketika Clipboard API tidak tersedia.
async function copyBookmarkletSource(source: string, sourceElement: HTMLTextAreaElement | null): Promise<"copied" | "selected" | "failed"> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(source);
      return "copied";
    } catch {
      // Lanjutkan ke fallback select agar user tetap memiliki cara manual yang jelas.
    }
  }

  if (sourceElement) {
    sourceElement.focus();
    sourceElement.select();
    return "selected";
  }

  return "failed";
}

// Menyediakan setup dan verifikasi bookmarklet tanpa menyimpan data di server atau browser storage.
export function BookmarkletSettingsPage() {
  const appOrigin = window.location.origin;
  const bookmarkletSource = useMemo(() => createBookmarkletSource(appOrigin), [appOrigin]);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState<BookmarkletFeedback | null>(null);

  // Menangani copy source dan memberi fallback keyboard tanpa mengklaim copy berhasil jika browser menolaknya.
  async function handleCopy() {
    const result = await copyBookmarkletSource(bookmarkletSource, sourceRef.current);
    if (result === "copied") {
      setFeedback({ tone: "success", message: "Source bookmarklet berhasil disalin ke clipboard." });
      return;
    }
    if (result === "selected") {
      setFeedback({ tone: "info", message: "Clipboard tidak tersedia. Source sudah dipilih; tekan Ctrl+C atau Cmd+C untuk menyalinnya." });
      return;
    }
    setFeedback({ tone: "error", message: "Source belum dapat dipilih otomatis. Pilih source secara manual lalu salin dari field di atas." });
  }

  // Membuka flow Save Article dengan URL halaman settings untuk memverifikasi handoff tanpa menyimpan artikel.
  function handleTest() {
    const destination = buildSaveArticleUrl(appOrigin, window.location.href);
    const openedWindow = window.open(destination, "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      setFeedback({ tone: "error", message: "Tab baru diblokir browser. Izinkan pop-up untuk SimpanDulu atau gunakan link bookmarklet secara langsung." });
      return;
    }
    setFeedback({ tone: "success", message: "Flow Save Article dibuka di tab baru dengan URL halaman ini." });
  }

  // Menjelaskan bahwa klik link bookmarklet adalah test handoff dan bukan aksi penyimpanan otomatis.
  function handleBookmarkletUse() {
    setFeedback({ tone: "success", message: "Bookmarklet dijalankan. SimpanDulu membuka form Save Article; artikel belum disimpan sampai kamu mengonfirmasi." });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p>
        <h1 className="font-editorial mt-1 text-5xl font-semibold">Bookmarklet</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Simpan halaman yang sedang kamu baca ke SimpanDulu dengan satu klik. Bookmarklet hanya meneruskan URL halaman dan tidak menyimpan credential jangka panjang.</p>
        <SettingsNavigation active="bookmarklet" />
      </header>

      <div className="mt-8 grid gap-5">
        <BookmarkletSetupCard source={bookmarkletSource} onCopy={() => void handleCopy()} onTest={handleTest} onUse={handleBookmarkletUse} feedback={feedback} sourceRef={sourceRef} />
        <InstallInstructions />
        <BrowserInstructions />

        <section aria-labelledby="bookmarklet-result-title" className="border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Hasil handoff</p>
          <h2 id="bookmarklet-result-title" className="font-editorial mt-2 text-3xl font-semibold">URL masuk ke Save Article</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Saat bookmarklet dipakai, SimpanDulu membuka route berikut dan mengisi field URL menggunakan alamat halaman yang sedang aktif:</p>
          <code className="mt-4 block overflow-x-auto border border-[var(--border-muted)] bg-[var(--surface)] p-3 font-mono text-xs text-[var(--text)]">/articles/new?url=%5BURL%20halaman%20saat%20ini%5D</code>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
          <Link to="/articles/new" className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-[var(--surface)]">Buka Save Article</Link>
          <Link to="/library" className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)]">Kembali ke Library</Link>
        </div>
      </div>
    </div>
  );
}
