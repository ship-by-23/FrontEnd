import { Grid2X2, List, Moon, RotateCcw, Sun, Type } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { SettingsNavigation } from "../settings/settings-navigation";
import { useAppearance } from "./appearance-provider";
import {
  READER_FONT_CLASSES,
  READER_TEXT_SIZE_CLASSES,
  type AppearancePreferences,
  type LibraryView,
  type ReaderFont,
  type ReaderTextSize,
  type ReaderTheme,
} from "./appearance-utils";

type ThemeSelectorProps = {
  value: ReaderTheme;
  onChange: (value: ReaderTheme) => void;
};

// Menampilkan pilihan tema Reader dengan radio input native yang mudah dipakai keyboard.
export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Tema Reader</legend>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Mengubah warna Reader tanpa mengganti route artikel.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 border px-4 transition-colors", value === "light" ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]")}>
          <input type="radio" name="appearance-theme" value="light" checked={value === "light"} onChange={() => onChange("light")} />
          <Sun className="size-4" aria-hidden="true" />
          <span className="font-semibold">Terang</span>
        </label>
        <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 border px-4 transition-colors", value === "dark" ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]")}>
          <input type="radio" name="appearance-theme" value="dark" checked={value === "dark"} onChange={() => onChange("dark")} />
          <Moon className="size-4" aria-hidden="true" />
          <span className="font-semibold">Gelap</span>
        </label>
      </div>
    </fieldset>
  );
}

type ReaderFontSelectorProps = {
  value: ReaderFont;
  onChange: (value: ReaderFont) => void;
};

// Menampilkan pilihan font isi Reader tanpa mengubah font editorial untuk heading aplikasi.
export function ReaderFontSelector({ value, onChange }: ReaderFontSelectorProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Font isi Reader</legend>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Pilih serif editorial atau sans-serif yang lebih netral.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 border px-4 transition-colors", value === "serif" ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]")}>
          <input type="radio" name="appearance-font" value="serif" checked={value === "serif"} onChange={() => onChange("serif")} />
          <Type className="size-4" aria-hidden="true" />
          <span className="font-serif text-lg">Serif editorial</span>
        </label>
        <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 border px-4 transition-colors", value === "sans" ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]")}>
          <input type="radio" name="appearance-font" value="sans" checked={value === "sans"} onChange={() => onChange("sans")} />
          <Type className="size-4" aria-hidden="true" />
          <span className="font-sans text-lg">Sans-serif</span>
        </label>
      </div>
    </fieldset>
  );
}

type TextSizeControlProps = {
  value: ReaderTextSize;
  onChange: (value: ReaderTextSize) => void;
};

// Menyediakan tiga tingkat ukuran teks Reader dengan target interaksi yang cukup besar di mobile.
export function TextSizeControl({ value, onChange }: TextSizeControlProps) {
  const options: Array<{ value: ReaderTextSize; label: string }> = [
    { value: "small", label: "Kecil" },
    { value: "medium", label: "Sedang" },
    { value: "large", label: "Besar" },
  ];

  return (
    <fieldset>
      <legend className="text-sm font-semibold">Ukuran teks</legend>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Mengatur ukuran isi artikel, bukan ukuran navigasi aplikasi.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className={cn("flex min-h-12 cursor-pointer items-center gap-3 border px-4 transition-colors", value === option.value ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]")}>
            <input type="radio" name="appearance-text-size" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className={cn(option.value === "small" && "text-sm", option.value === "large" && "text-lg", "font-semibold")}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type LibraryViewPreferenceProps = {
  value: LibraryView;
  onChange: (value: LibraryView) => void;
};

// Menetapkan mode Library default tanpa menghapus kemampuan URL view untuk link yang dapat dibagikan.
export function LibraryViewPreference({ value, onChange }: LibraryViewPreferenceProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Tampilan default Library</legend>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Dipakai ketika URL Library tidak menetapkan parameter view.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button type="button" variant={value === "grid" ? "primary" : "secondary"} aria-pressed={value === "grid"} onClick={() => onChange("grid")}>
          <Grid2X2 className="size-4" aria-hidden="true" />Grid
        </Button>
        <Button type="button" variant={value === "list" ? "primary" : "secondary"} aria-pressed={value === "list"} onClick={() => onChange("list")}>
          <List className="size-4" aria-hidden="true" />List
        </Button>
      </div>
    </fieldset>
  );
}

// Menampilkan preview Reader yang berubah langsung ketika preference lokal diubah.
function AppearancePreview({ preferences }: { preferences: AppearancePreferences }) {
  const dark = preferences.theme === "dark";
  return (
    <section aria-labelledby="appearance-preview-title" className={cn("border p-5 transition-colors sm:p-7", dark ? "border-[var(--reader-dark-text)]/30 bg-[var(--reader-dark)] text-[var(--reader-dark-text)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Preview Reader</p>
      <h2 id="appearance-preview-title" className="font-editorial mt-2 text-3xl font-semibold">Ruang baca yang tenang</h2>
      <p className={cn("prose max-w-none mt-4 leading-8 opacity-80", READER_FONT_CLASSES[preferences.readerFont], READER_TEXT_SIZE_CLASSES[preferences.textSize])}>
        Preview ini memperlihatkan perubahan tema, font, dan ukuran teks tanpa memuat ulang halaman.
      </p>
    </section>
  );
}

// Merender halaman Appearance lengkap dengan preference lokal, feedback, preview, dan reset default.
export function AppearanceSettings() {
  const { preferences, storageAvailable, updatePreferences, resetPreferences } = useAppearance();
  const [feedback, setFeedback] = useState("");

  // Menerapkan patch preference sekaligus memberi feedback ringan untuk perubahan yang berhasil diproses.
  function handlePreferenceChange(patch: Partial<AppearancePreferences>) {
    const persisted = updatePreferences(patch);
    setFeedback(persisted ? "Perubahan tampilan diterapkan." : "Perubahan diterapkan untuk sesi ini; browser menolak penyimpanan lokal.");
  }

  // Mengembalikan seluruh kontrol Appearance ke default yang aman untuk user baru.
  function handleReset() {
    const persisted = resetPreferences();
    setFeedback(persisted ? "Preference dikembalikan ke default." : "Default diterapkan untuk sesi ini; browser menolak penyimpanan lokal.");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p>
        <h1 className="font-editorial mt-1 text-5xl font-semibold">Tampilan</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Atur pengalaman membaca dan tampilan awal Library. Preference disimpan di browser ini sampai sinkronisasi antardevice memiliki contract resmi.</p>
        <SettingsNavigation active="appearance" />
      </header>

      <div className="mt-8 grid gap-5">
        <section aria-labelledby="appearance-theme-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <h2 id="appearance-theme-title" className="font-editorial text-3xl font-semibold">Tema</h2>
          <div className="mt-6"><ThemeSelector value={preferences.theme} onChange={(theme) => handlePreferenceChange({ theme })} /></div>
        </section>

        <section aria-labelledby="appearance-type-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <h2 id="appearance-type-title" className="font-editorial text-3xl font-semibold">Typography Reader</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <ReaderFontSelector value={preferences.readerFont} onChange={(readerFont) => handlePreferenceChange({ readerFont })} />
            <TextSizeControl value={preferences.textSize} onChange={(textSize) => handlePreferenceChange({ textSize })} />
          </div>
        </section>

        <section aria-labelledby="appearance-library-title" className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <h2 id="appearance-library-title" className="font-editorial text-3xl font-semibold">Library</h2>
          <div className="mt-6"><LibraryViewPreference value={preferences.libraryView} onChange={(libraryView) => handlePreferenceChange({ libraryView })} /></div>
        </section>

        <AppearancePreview preferences={preferences} />

        <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold" role="status" aria-live="polite">{feedback || "Preference aktif di browser ini."}</p>
            {!storageAvailable ? <p className="mt-1 text-sm text-[var(--warning)]">Browser tidak mengizinkan penyimpanan lokal. Preview tetap aktif, tetapi perubahan dapat hilang setelah refresh.</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleReset}><RotateCcw className="size-4" aria-hidden="true" />Kembalikan default</Button>
            <Link to="/library" className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-[var(--surface)]">Buka Library</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
