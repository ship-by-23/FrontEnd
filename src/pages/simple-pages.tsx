import { Link } from "react-router-dom";
import { AppearanceSettings } from "../features/appearance/appearance-components";
import { SettingsNavigation, type SettingsSection } from "../features/settings/settings-navigation";
import { ProfileSettingsPanel, SecuritySettingsPanel } from "../features/settings/settings-components";

type SettingsLayoutProps = {
  section: Exclude<SettingsSection, "appearance" | "bookmarklet">;
  title: string;
  description: string;
  children: React.ReactNode;
};

// Menyatukan header dan navigasi untuk halaman settings yang menggunakan data session nyata.
function SettingsLayout({ section, title, description, children }: SettingsLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-[var(--border)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p>
        <h1 className="font-editorial mt-1 text-5xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
        <SettingsNavigation active={section} />
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function SettingsPage({ section }: { section: SettingsSection }) {
  if (section === "appearance") return <AppearanceSettings />;
  if (section === "profile") {
    return (
      <SettingsLayout
        section="profile"
        title="Profil"
        description="Kelola identitas akun melalui endpoint profil resmi dan session user aktif."
      >
        <ProfileSettingsPanel />
      </SettingsLayout>
    );
  }
  if (section === "security") {
    return (
      <SettingsLayout
        section="security"
        title="Keamanan"
        description="Ubah password dan kelola session tanpa menyimpan credential jangka panjang di browser."
      >
        <SecuritySettingsPanel />
      </SettingsLayout>
    );
  }

  const content: Record<string, [string, string]> = {
    bookmarklet: ["Bookmarklet", "Gunakan route /articles/new?url=… untuk mengisi URL tanpa menyimpan kredensial pada bookmarklet."],
  };
  const [title, description] = content[section] ?? ["Pengaturan", "Pengaturan akun."];
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Pengaturan</p><h1 className="font-editorial mt-1 text-5xl font-semibold">{title}</h1><SettingsNavigation active={section} /><section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6"><p className="leading-7 text-[var(--text-muted)]">{description}</p></section></div>;
}

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-sm font-semibold">404</p><h1 className="font-editorial mt-2 text-5xl font-semibold">Halaman tidak ditemukan</h1><p className="mt-4 text-[var(--text-muted)]">Alamat mungkin berubah atau halaman sudah tidak tersedia.</p><Link className="mt-7 inline-flex min-h-11 items-center border border-[var(--border)] bg-[var(--text)] px-4 text-sm font-semibold text-white" to="/">Kembali ke awal</Link></div></main>;
}
