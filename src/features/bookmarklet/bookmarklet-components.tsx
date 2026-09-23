import { AlertTriangle, BookmarkPlus, Check, Clipboard, ExternalLink, Info } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export type BookmarkletFeedback = {
  tone: "info" | "success" | "error";
  message: string;
};

type BookmarkletButtonProps = {
  source: string;
  onUse: () => void;
};

// Menyediakan anchor bookmarklet yang dapat diklik untuk test atau diseret ke bookmark bar.
export function BookmarkletButton({ source, onUse }: BookmarkletButtonProps) {
  return (
    <a
      href={source}
      draggable="true"
      onClick={onUse}
      className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--border)] bg-[var(--text)] px-5 text-sm font-semibold text-[var(--surface)] transition-colors hover:bg-black"
      aria-label="Bookmarklet SimpanDulu, klik untuk mencoba atau seret ke bookmark bar"
    >
      <BookmarkPlus className="size-4" aria-hidden="true" />
      SimpanDulu
    </a>
  );
}

type BookmarkletTestStateProps = {
  feedback: BookmarkletFeedback | null;
};

// Menampilkan feedback copy dan test bookmarklet melalui live region tanpa modal yang mengganggu.
export function BookmarkletTestState({ feedback }: BookmarkletTestStateProps) {
  if (!feedback) return null;

  const Icon = feedback.tone === "success" ? Check : feedback.tone === "error" ? AlertTriangle : Info;
  const toneClass = feedback.tone === "success"
    ? "border-[var(--success)] text-[var(--success)]"
    : feedback.tone === "error"
      ? "border-[var(--danger)] text-[var(--danger)]"
      : "border-[var(--border-muted)] text-[var(--text-muted)]";

  return (
    <p className={cn("flex items-start gap-2 border-l-2 px-3 py-2 text-sm leading-6", toneClass)} role={feedback.tone === "error" ? "alert" : "status"} aria-live="polite">
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>{feedback.message}</span>
    </p>
  );
}

type BookmarkletSetupCardProps = {
  source: string;
  onCopy: () => void;
  onTest: () => void;
  onUse: () => void;
  feedback: BookmarkletFeedback | null;
  sourceRef: RefObject<HTMLTextAreaElement | null>;
  children?: ReactNode;
};

// Menyatukan affordance drag, copy, test, dan source bookmarklet dalam satu card yang responsif.
export function BookmarkletSetupCard({ source, onCopy, onTest, onUse, feedback, sourceRef, children }: BookmarkletSetupCardProps) {
  return (
    <section aria-labelledby="bookmarklet-setup-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <BookmarkPlus className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 id="bookmarklet-setup-title" className="font-editorial text-3xl font-semibold">Pasang bookmarklet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Gunakan link ini untuk mengirim halaman yang sedang dibuka ke form Save Article. Bookmarklet tidak menyimpan password atau token sesi.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <BookmarkletButton source={source} onUse={onUse} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onCopy}><Clipboard className="size-4" aria-hidden="true" />Copy bookmarklet</Button>
          <Button type="button" variant="ghost" onClick={onTest}><ExternalLink className="size-4" aria-hidden="true" />Tes di tab baru</Button>
        </div>
      </div>

      <BookmarkletTestState feedback={feedback} />

      <div className="mt-6 grid gap-2">
        <label htmlFor="bookmarklet-source" className="text-sm font-semibold">Source bookmarklet</label>
        <textarea
          ref={sourceRef}
          id="bookmarklet-source"
          className="min-h-28 w-full resize-y rounded-[3px] border border-[var(--border-muted)] bg-[var(--cream)] p-3 font-mono text-xs leading-5 text-[var(--text)] focus-visible:outline-none"
          readOnly
          value={source}
          spellCheck={false}
          aria-describedby="bookmarklet-source-help"
          onFocus={(event) => event.currentTarget.select()}
        />
        <p id="bookmarklet-source-help" className="text-xs leading-5 text-[var(--text-muted)]">Jika tombol Copy tidak tersedia, fokuskan field ini, pilih seluruh source, lalu salin dengan Ctrl+C atau Cmd+C.</p>
      </div>

      {children}
    </section>
  );
}

// Menjelaskan langkah pemasangan yang sama pada browser desktop tanpa bergantung pada vendor tertentu.
export function InstallInstructions() {
  return (
    <section aria-labelledby="bookmarklet-install-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <h2 id="bookmarklet-install-title" className="font-editorial text-3xl font-semibold">Cara memasang</h2>
      <ol className="mt-5 grid gap-4 text-sm leading-6 text-[var(--text-muted)]">
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center border border-[var(--border)] font-semibold text-[var(--text)]">1</span><span>Tampilkan bookmark bar browser jika sedang disembunyikan.</span></li>
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center border border-[var(--border)] font-semibold text-[var(--text)]">2</span><span>Seret link <strong className="text-[var(--text)]">SimpanDulu</strong> ke bookmark bar.</span></li>
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center border border-[var(--border)] font-semibold text-[var(--text)]">3</span><span>Buka artikel yang ingin disimpan, lalu klik bookmarklet tersebut.</span></li>
        <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center border border-[var(--border)] font-semibold text-[var(--text)]">4</span><span>Form Save Article akan terbuka dengan URL halaman aktif yang sudah terisi.</span></li>
      </ol>
    </section>
  );
}

// Memberikan fallback pemasangan ketika drag-and-drop bookmark bar tidak tersedia.
export function BrowserInstructions() {
  return (
    <section aria-labelledby="bookmarklet-browser-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <h2 id="bookmarklet-browser-title" className="font-editorial text-3xl font-semibold">Jika drag tidak tersedia</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Gunakan tombol Copy bookmarklet, buat bookmark baru melalui menu browser, lalu tempel source tersebut ke field URL atau address bookmark. Source harus tetap diawali <code className="border border-[var(--border-muted)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs">javascript:</code>.</p>
      <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-sm leading-6 text-[var(--text-muted)]">Klik link bookmarklet di halaman ini juga dapat dipakai sebagai test. Aplikasi akan membuka Save Article di tab baru dengan halaman settings sebagai contoh URL.</p>
    </section>
  );
}
