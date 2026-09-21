import {
  ArrowDown,
  ArrowRight,
  BookMarked,
  BookOpen,
  Bookmark,
  FileText,
  Highlighter,
  Search,
  Tags,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Bookmark, title: "Simpan dari URL", description: "Kumpulkan artikel yang ingin dibaca tanpa kehilangan tautan dan konteksnya." },
  { icon: FileText, title: "Baca tanpa gangguan", description: "Isi artikel diekstrak menjadi salinan bersih yang nyaman dibaca di dalam aplikasi." },
  { icon: BookOpen, title: "Lanjutkan bacaan", description: "Status, progres, dan posisi terakhir membantu kamu kembali ke bagian yang tepat." },
  { icon: Search, title: "Temukan isi artikel", description: "Cari kembali gagasan dari judul, deskripsi, maupun isi bacaan yang tersimpan." },
  { icon: Highlighter, title: "Tandai yang penting", description: "Simpan highlight dan catatan agar bagian penting tidak tenggelam setelah dibaca." },
  { icon: Tags, title: "Susun dengan tag", description: "Kelompokkan bacaan dengan tag pribadi yang sesuai dengan cara berpikirmu." },
  { icon: BookMarked, title: "Simpan lewat bookmarklet", description: "Kirim halaman yang sedang dibuka ke SimpanDulu melalui alur konfirmasi yang aman." },
] as const;

const steps = [
  ["01", "Tempel URL"],
  ["02", "Artikel diproses"],
  ["03", "Masuk ke library"],
  ["04", "Baca di reader"],
  ["05", "Progres tersimpan"],
  ["06", "Temukan kembali"],
] as const;

// Menampilkan landing statis yang menjelaskan nilai produk tanpa bergantung pada data API.
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--cream)]">
      <a href="#main-content" className="skip-link">Lewati ke konten utama</a>

      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="SimpanDulu, halaman utama" className="flex min-h-11 items-center gap-2 font-editorial text-2xl font-semibold">
            <BookOpen className="size-6" aria-hidden="true" />SimpanDulu
          </Link>
          <nav aria-label="Navigasi akun" className="flex items-center gap-1 sm:gap-3">
            <Link className="inline-flex min-h-11 items-center px-3 text-sm font-semibold underline-offset-4 hover:underline" to="/login">Masuk</Link>
            <Link className="landing-button landing-button-primary px-3 sm:px-5" to="/register">Buat akun</Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:py-32" aria-labelledby="hero-title">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Pustaka bacaan pribadi</p>
            <h1 id="hero-title" className="max-w-4xl text-balance font-editorial text-5xl font-semibold leading-[0.94] sm:text-7xl lg:text-[5.5rem]">Simpan sekarang.<br />Baca saat pikiran siap.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--text-muted)] sm:text-xl">Simpan artikel penting, baca dalam tampilan yang bersih, lanjutkan dari posisi terakhir, dan temukan kembali gagasan yang pernah menarik perhatianmu.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="landing-button landing-button-primary" to="/register">Buat akun <ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link className="landing-button landing-button-secondary" to="/login">Masuk</Link>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--text-muted)]">Setiap library bersifat privat. Bacaanmu hanya dapat diakses oleh akunmu.</p>
          </div>

          <div className="landing-illustration" aria-hidden="true">
            <div className="landing-illustration-toolbar"><span /><span /><span /></div>
            <div className="landing-illustration-body">
              <div className="landing-illustration-nav"><span className="w-2/3" /><span /><span className="w-4/5" /><span className="w-1/2" /></div>
              <div className="landing-illustration-page">
                <span className="landing-illustration-kicker" /><span className="landing-illustration-heading" /><span className="landing-illustration-heading w-3/4" />
                <div className="mt-8 grid gap-3"><span /><span /><span className="w-5/6" /><span /><span className="w-2/3" /></div>
                <div className="landing-illustration-mark mt-8"><span /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]" aria-labelledby="features-title">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Dari simpan hingga ditemukan kembali</p>
                <h2 id="features-title" className="mt-4 max-w-lg text-balance font-editorial text-4xl font-semibold leading-tight sm:text-6xl">Satu tempat untuk menjaga alur bacaan.</h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-8 text-[var(--text-muted)]">Bukan sekadar daftar tautan. SimpanDulu menjaga isi, progres, dan catatan agar setiap bacaan tetap berguna setelah tab browser ditutup.</p>
            </div>
            <ul className="mt-14 grid border-l border-t border-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="min-h-64 border-b border-r border-[var(--border)] p-6 sm:p-8">
                  <Icon className="size-6" strokeWidth={1.6} aria-hidden="true" />
                  <h3 className="mt-12 font-editorial text-3xl font-semibold">{title}</h3>
                  <p className="mt-3 max-w-sm leading-7 text-[var(--text-muted)]">{description}</p>
                </li>
              ))}
              <li className="flex min-h-64 items-end border-b border-r border-[var(--border)] bg-[var(--accent)] p-6 sm:p-8" aria-hidden="true">
                <div className="w-full space-y-3"><span className="block h-px w-full bg-[var(--border)]" /><span className="block h-px w-4/5 bg-[var(--border)]" /><span className="block h-px w-3/5 bg-[var(--border)]" /></div>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="process-title">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Cara kerja</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <h2 id="process-title" className="max-w-xl text-balance font-editorial text-4xl font-semibold leading-tight sm:text-6xl">Dari satu URL menjadi bacaan yang dapat kembali ditemukan.</h2>
            <p className="max-w-xl self-end text-lg leading-8 text-[var(--text-muted)]">Alur yang sederhana membawamu dari menemukan artikel hingga menyimpan pemikiran penting di dalamnya.</p>
          </div>
          <ol className="mt-14 grid border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
            {steps.map(([number, label], index) => (
              <li key={number} className="relative flex min-h-36 items-end justify-between gap-4 border-b border-[var(--border)] py-6 md:px-6 md:first:pl-0 lg:nth-[3n+1]:pl-0">
                <div><span className="text-xs font-semibold text-[var(--text-muted)]">{number}</span><h3 className="mt-2 font-editorial text-2xl font-semibold">{label}</h3></div>
                {index < steps.length - 1 ? <ArrowDown className="size-5 text-[var(--text-muted)] lg:-rotate-90" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--accent)]" aria-labelledby="cta-title">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 id="cta-title" className="max-w-4xl text-balance font-editorial text-5xl font-semibold leading-[1.02] sm:text-7xl">Beri ruang untuk bacaan yang ingin kamu simpan.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8">Mulai bangun library pribadi dan kembali membaca ketika waktunya tepat.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="landing-button landing-button-primary" to="/register">Buat akun <ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link className="landing-button landing-button-transparent" to="/login">Masuk</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-editorial text-xl font-semibold">SimpanDulu</p>
          <p className="text-[var(--text-muted)]">Pustaka pribadi untuk perhatian yang lebih terjaga.</p>
        </div>
      </footer>
    </div>
  );
}
