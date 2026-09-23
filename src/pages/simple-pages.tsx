import { useQuery } from "@tanstack/react-query";
import { Bookmark, Copy, ExternalLink, Info, LogOut, ShieldCheck, Tag as TagIcon, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/form-controls";
import { ThemeSwitch } from "../components/ui/theme-switch";
import { useAuth } from "../features/auth/auth-context";
import { apiRequest } from "../lib/api/client";
import type { Tag } from "../lib/api/types";
import { createLocalTag, useLocalTags } from "../lib/local-tags";
import { formatDate } from "../lib/utils";

type TagCollection = { data: Tag[] } | Tag[];

function getInitials(name?: string | null) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return initials || "SD";
}

export function TagsPage() {
  const query = useQuery({ queryKey: ["tags"], queryFn: ({ signal }) => apiRequest<TagCollection>("/tags", { signal }) });
  const localTags = useLocalTags();
  const [name, setName] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createLocalTag(name)) {
      toast.success("Tag perangkat dibuat. Pilih tag tersebut dari halaman reader artikel.");
      setName("");
    }
  }

  const serverTags = query.data ? (Array.isArray(query.data) ? query.data : query.data.data) : [];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Organisasi</p>
      <h1 className="font-editorial mt-1 text-5xl font-semibold">Tag</h1>

      <section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6" aria-labelledby="local-tags-heading">
        <div className="flex items-center gap-3"><TagIcon className="size-5" aria-hidden="true" /><div><h2 id="local-tags-heading" className="font-editorial text-3xl font-semibold">Tag perangkat</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Bisa dipakai sekarang tanpa mengubah API. Data tersimpan di browser ini.</p></div></div>
        <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={handleCreate}>
          <Input aria-label="Nama tag perangkat" value={name} onChange={(event) => setName(event.target.value)} placeholder="Misalnya: Kuliah, Kerja, Referensi" maxLength={40} />
          <Button type="submit" disabled={!name.trim()}>Buat tag</Button>
        </form>
        {localTags.length === 0 ? <p className="mt-5 text-sm text-[var(--text-muted)]">Belum ada tag perangkat. Tag yang dibuat juga bisa dipasang dari reader artikel.</p> : <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{localTags.map((tag) => <li key={tag.id}><Link to={`/library?localTag=${encodeURIComponent(tag.id)}`} className="block border border-[var(--border-muted)] p-4 transition-colors hover:bg-[var(--surface-muted)]"><span className="font-semibold">{tag.name}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{tag.articleIds.length} artikel · Lihat di library</span></Link></li>)}</ul>}
      </section>

      <section className="mt-8" aria-labelledby="server-tags-heading">
        <h2 id="server-tags-heading" className="font-editorial text-3xl font-semibold">Tag akun</h2>
        {query.isPending ? <LoadingState label="Memuat tag akun…" /> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Tag akun tidak dapat dimuat."} onRetry={() => void query.refetch()} /> : serverTags.length === 0 ? <EmptyState title="Belum ada tag akun" description="Tag yang dikelola backend akan tampil di sini ketika tersedia." /> : <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{serverTags.map((tag) => <li key={tag.id}><Link to={`/tags/${tag.id}`} className="block border border-[var(--border)] bg-[var(--surface)] p-5 font-semibold hover:bg-[var(--surface-muted)]">{tag.name}</Link></li>)}</ul>}
      </section>

      <section className="mt-8 flex flex-col gap-4 border border-[var(--border-muted)] bg-[var(--surface-muted)] p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="tag-bookmarklet-heading">
        <div className="flex items-start gap-3"><Bookmark className="mt-1 size-5 shrink-0" aria-hidden="true" /><div><h2 id="tag-bookmarklet-heading" className="font-semibold">Tag dan bookmarklet itu berbeda</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Tag mengelompokkan artikel setelah tersimpan. Bookmarklet adalah alat kecil di browser untuk mengirim URL halaman aktif ke form SimpanDulu.</p></div></div>
        <Link to="/settings/bookmarklet" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold hover:bg-[var(--cream)]"><Bookmark className="size-4" aria-hidden="true" />Buka bookmarklet</Link>
      </section>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8" aria-labelledby="profile-card-heading">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-xl font-bold text-[var(--text)]" aria-hidden="true">{getInitials(user?.name)}</span><div><h2 id="profile-card-heading" className="font-editorial text-3xl font-semibold">{user?.name ?? "Pengguna SimpanDulu"}</h2><p className="mt-1 text-[var(--text-muted)]">{user?.email ?? "Email belum tersedia"}</p></div></div>
        <dl className="mt-8 grid gap-4 border-t border-[var(--border-muted)] pt-6 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Nama</dt><dd className="mt-1">{user?.name ?? "—"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Email</dt><dd className="mt-1 break-all">{user?.email ?? "—"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Bergabung</dt><dd className="mt-1">{formatDate(user?.createdAt)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Peran</dt><dd className="mt-1">{user?.role === "admin" ? "Admin" : "Pengguna"}</dd></div></dl>
        <p className="mt-8 border-l-2 border-[var(--accent)] pl-4 text-sm leading-6 text-[var(--text-muted)]">Informasi profil ditampilkan dari sesi yang sudah ada. Form perubahan nama/email sengaja belum dibuat karena endpoint backend untuk update profil belum tersedia.</p>
    </section>
  );
}

function AppearanceSettings() {
  return (
    <section className="flex flex-col gap-6 border border-[var(--border)] bg-[var(--surface)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><h2 className="font-editorial text-3xl font-semibold">Mode warna</h2><p className="mt-2 max-w-xl leading-7 text-[var(--text-muted)]">Mode tersimpan lokal di browser. Pengunjung baru memulai dari tema terang dan pilihan berikutnya akan diingat.</p></div><ThemeSwitch /></section>
  );
}

function getBookmarkletCode() {
  if (typeof window === "undefined") return "javascript:(()=>{})()";
  const target = `${window.location.origin}/articles/new?url=`;
  return `javascript:(()=>{const u=encodeURIComponent(location.href);window.open(${JSON.stringify(target)}+u,"_blank","noopener,noreferrer")})()`;
}

function BookmarkletSettings() {
  const code = getBookmarkletCode();
  const [copied, setCopied] = useState(false);

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Bookmarklet disalin.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard tidak tersedia. Salin kode secara manual.");
    }
  }

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"><p className="leading-7 text-[var(--text-muted)]">Simpan halaman yang sedang dibuka tanpa menyalin URL secara manual. Bookmarklet ini membuka form SimpanDulu dengan URL aktif; proses penyimpanan tetap menggunakan API yang sudah ada.</p><div className="mt-6 rounded-[3px] border border-[var(--border-muted)] bg-[var(--surface-muted)] p-4"><code className="block max-h-32 overflow-auto break-all text-xs leading-6">{code}</code></div><Button className="mt-4" onClick={() => void copyBookmarklet()}><Copy className="size-4" aria-hidden="true" />{copied ? "Tersalin" : "Salin bookmarklet"}</Button><ol className="mt-8 grid gap-3 text-sm leading-6 text-[var(--text-muted)]"><li><span className="font-semibold text-[var(--text)]">1.</span> Salin kode bookmarklet di atas.</li><li><span className="font-semibold text-[var(--text)]">2.</span> Buat bookmark baru di browser dan tempel kode tersebut ke kolom URL.</li><li><span className="font-semibold text-[var(--text)]">3.</span> Saat membaca halaman, klik bookmarklet lalu lanjutkan proses di <Link className="font-semibold underline" to="/articles/new">Simpan artikel</Link>.</li></ol><p className="mt-6 flex items-start gap-2 text-xs text-[var(--text-muted)]"><ExternalLink className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Bookmarklet tidak menyimpan kredensial; autentikasi tetap dikelola oleh session aplikasi.</p></section>
  );
}

type SettingsItem = {
  to: string;
  label: string;
  description: string;
  icon: typeof UserRound;
  section?: string;
};

const settingsItems: SettingsItem[] = [
  { to: "/settings/profile", label: "Profil", description: "Identitas akun", icon: UserRound, section: "profile" },
  { to: "/settings/about", label: "Tentang aplikasi", description: "Cara kerja SimpanDulu", icon: Info, section: "about" },
];

function SettingsLayout({ section, title, description, children }: { section: string; title: string; description: string; children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-[var(--border)] pb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p><h1 className="font-editorial mt-1 text-5xl font-semibold">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p></header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <nav className="border border-[var(--border)] bg-[var(--surface)] p-2" aria-label="Menu pengaturan">
            <div className="grid gap-1">
              {settingsItems.map(({ to, label, description: itemDescription, icon: Icon, section: itemSection }) => (
                <Link key={to} to={to} className={`flex items-start gap-3 rounded-[3px] border-l-2 px-3 py-3 transition-colors hover:bg-[var(--surface-muted)] ${itemSection === section ? "border-[var(--text)] bg-[var(--surface-muted)]" : "border-transparent"}`}>
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{itemDescription}</span></span>
                </Link>
              ))}
            </div>
            <div className="mt-2 border-t border-[var(--border-muted)] pt-2"><Button variant="ghost" className="w-full justify-start" onClick={() => void logout()}><LogOut className="size-4" aria-hidden="true" />Keluar akun</Button></div>
          </nav>
          <div className="mt-4 border border-[var(--border-muted)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Zona akun</p><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Penghapusan akun membutuhkan endpoint backend khusus agar aman dan dapat dikonfirmasi.</p><Button variant="danger" className="mt-3 w-full" disabled><Trash2 className="size-4" aria-hidden="true" />Hapus akun</Button></div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5" aria-hidden="true" /><div><h2 className="font-editorial text-3xl font-semibold">Keamanan akun</h2><p className="mt-3 leading-7 text-[var(--text-muted)]">Perubahan password dan pengelolaan sesi akan menggunakan kontrak autentikasi resmi setelah endpoint backend tersedia. Logout tetap tersedia dari menu pengaturan ini.</p></div></div></section>;
}

function AboutSettings() {
  return <section className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"><div className="flex items-start gap-3"><Info className="mt-1 size-5" aria-hidden="true" /><div><h2 className="font-editorial text-3xl font-semibold">Tentang SimpanDulu</h2><p className="mt-3 leading-7 text-[var(--text-muted)]">SimpanDulu membantu menyimpan artikel, melanjutkan progress membaca, mencari isi bacaan, dan mengelompokkan artikel dengan tag.</p><p className="mt-4 text-sm text-[var(--text-muted)]">Sebagian fitur seperti profil yang dapat diedit, tag akun, dan penghapusan akun tetap mengikuti ketersediaan kontrak backend.</p></div></div></section>;
}

export function SettingsPage({ section }: { section: string }) {
  const content = section === "profile" ? <ProfileSettings /> : section === "appearance" ? <AppearanceSettings /> : section === "bookmarklet" ? <BookmarkletSettings /> : section === "about" ? <AboutSettings /> : <SecuritySettings />;
  const title = section === "profile" ? "Profil" : section === "appearance" ? "Tampilan" : section === "bookmarklet" ? "Bookmarklet" : section === "about" ? "Tentang aplikasi" : "Keamanan";
  const description = section === "profile" ? "Lihat identitas akun yang sedang digunakan." : section === "appearance" ? "Atur tampilan SimpanDulu untuk seluruh halaman." : section === "bookmarklet" ? "Simpan halaman aktif dari browser tanpa menyalin URL manual." : section === "about" ? "Ringkasan fitur dan batasan integrasi aplikasi." : "Kelola hal-hal yang berkaitan dengan akses akun.";
  return <SettingsLayout section={section} title={title} description={description}>{content}</SettingsLayout>;
}

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-sm font-semibold">404</p><h1 className="font-editorial mt-2 text-5xl font-semibold">Halaman tidak ditemukan</h1><p className="mt-4 text-[var(--text-muted)]">Alamat mungkin berubah atau halaman sudah tidak tersedia.</p><Link className="mt-7 inline-flex min-h-11 items-center border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-[var(--surface)]" to="/">Kembali ke awal</Link></div></main>;
}
