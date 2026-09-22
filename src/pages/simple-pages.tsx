import { Link } from "react-router-dom";

export function SettingsPage({ section }: { section: string }) {
  const content: Record<string, [string, string]> = {
    profile: ["Profil", "Perbarui identitas akun melalui API profil setelah kontrak field final tersedia."],
    appearance: ["Tampilan", "Tema reader disimpan lokal pada browser ini. Sinkronisasi antardevice menunggu keputusan produk."],
    security: ["Keamanan", "Perubahan password dan pengelolaan sesi akan menggunakan kontrak autentikasi resmi."],
    bookmarklet: ["Bookmarklet", "Gunakan route /articles/new?url=… untuk mengisi URL tanpa menyimpan kredensial pada bookmarklet."],
  };
  const [title, description] = content[section] ?? ["Pengaturan", "Pengaturan akun."];
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p><h1 className="font-editorial mt-1 text-5xl font-semibold">{title}</h1><section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6"><p className="leading-7 text-[var(--text-muted)]">{description}</p></section></div>;
}

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-sm font-semibold">404</p><h1 className="font-editorial mt-2 text-5xl font-semibold">Halaman tidak ditemukan</h1><p className="mt-4 text-[var(--text-muted)]">Alamat mungkin berubah atau halaman sudah tidak tersedia.</p><Link className="mt-7 inline-flex min-h-11 items-center border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white" to="/">Kembali ke awal</Link></div></main>;
}
