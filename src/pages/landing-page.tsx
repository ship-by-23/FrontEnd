import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-editorial text-2xl font-semibold"><BookOpen aria-hidden="true" />SimpanDulu</Link>
        <nav aria-label="Navigasi akun" className="flex items-center gap-2">
          <Link className="px-3 py-2 text-sm font-semibold" to="/login">Masuk</Link>
          <Link className="rounded-[3px] border border-[var(--border)] bg-[var(--text)] px-4 py-2 text-sm font-semibold text-white" to="/register">Buat akun</Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:py-32">
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">Read-it-later yang tenang</p>
            <h1 className="font-editorial max-w-4xl text-balance text-6xl font-semibold leading-[0.92] sm:text-7xl lg:text-8xl">Simpan sekarang. Baca ketika pikiran siap.</h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">Simpan artikel penting, baca dalam tampilan yang bersih, lanjutkan dari posisi terakhir, dan temukan kembali gagasan yang pernah menarik perhatianmu.</p>
            <Link className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-[3px] border border-[var(--border)] bg-[var(--text)] px-6 font-semibold text-white" to="/register">Mulai menyimpan <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="grid content-end gap-0 border border-[var(--border)] bg-[var(--surface)]">
            {[{ icon: Sparkles, title: "Konten yang bersih", text: "Artikel disimpan tanpa gangguan visual halaman asal." }, { icon: BookOpen, title: "Progres terjaga", text: "Kembali membaca tepat dari posisi terakhir." }, { icon: Search, title: "Mudah ditemukan", text: "Cari gagasan dari judul, deskripsi, dan isi." }].map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-b border-[var(--border-muted)] p-6 last:border-0">
                <Icon className="mb-6 size-5" aria-hidden="true" /><h2 className="font-editorial text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
