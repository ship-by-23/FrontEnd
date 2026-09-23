import { AnimatePresence, motion } from "motion/react";
import { BookmarkPlus, Library, Menu, Search, Settings, Tags, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { cn } from "../../lib/utils";
import { Brand } from "../brand/brand";
import { Button } from "../ui/button";
import { ThemeSwitch } from "../ui/theme-switch";

const navigation = [
  { to: "/library", label: "Library", icon: Library },
  { to: "/articles/new", label: "Simpan artikel", icon: BookmarkPlus },
  { to: "/search", label: "Pencarian", icon: Search },
  { to: "/tags", label: "Tag", icon: Tags },
  { to: "/settings/profile", label: "Pengaturan", icon: Settings },
];

function getInitials(name?: string | null) {
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return initials || "SD";
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/library" onClick={onNavigate} aria-label="SimpanDulu — pustaka" className="flex min-h-16 items-center border-b border-[var(--border)] px-4">
        <Brand compact className="max-w-full" />
      </Link>
      <nav aria-label="Navigasi utama" className="grid flex-1 content-start gap-1 p-3">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              "flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition-colors",
              isActive ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-transparent hover:bg-[var(--surface-muted)]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// Menyediakan navigasi konsisten dan drawer aksesibel untuk seluruh route terproteksi.
export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[260px_1fr] lg:overflow-hidden">
      <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-20 bg-[var(--text)] px-4 py-2 text-[var(--surface)] focus:translate-y-0">Lewati ke konten</a>
      <aside className="hidden h-screen overflow-y-auto overscroll-contain border-r border-[var(--border)] bg-[var(--surface)] lg:block"><SidebarContent /></aside>
      <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[color:var(--cream)]/95 px-4 backdrop-blur-sm lg:px-8">
          <Button variant="ghost" className="px-3 lg:hidden" aria-label="Buka navigasi" aria-expanded={open} onClick={() => setOpen(true)}><Menu aria-hidden="true" /></Button>
          <Link to="/library" aria-label="SimpanDulu — pustaka" className="lg:hidden"><Brand compact /></Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitch />
            <Link to="/settings/profile" className="group flex min-h-10 items-center gap-2 rounded-[3px] px-1.5 transition-colors hover:bg-[var(--surface-muted)]" aria-label="Buka profil pengguna">
              <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--text)]" aria-hidden="true">{getInitials(user?.name)}</span>
              <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-semibold">{user?.name}</span><span className="block text-[10px] text-[var(--text-muted)]">Profil</span></span>
            </Link>
          </div>
        </header>
        <main id="main-content" className="page-enter mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-10"><Outlet /></main>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/45" aria-label="Tutup navigasi" onClick={() => setOpen(false)} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigasi mobile"
              className="relative h-full w-[min(86vw,320px)] border-r border-[var(--border)] bg-[var(--surface)]"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.2 }}
            >
              <Button variant="ghost" className="absolute right-3 top-3 z-10 px-3" aria-label="Tutup navigasi" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
