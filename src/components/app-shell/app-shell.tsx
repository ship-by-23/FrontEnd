import { AnimatePresence, motion } from "motion/react";
import { BookOpen, BookmarkPlus, Library, LogOut, Menu, Search, Settings, Tags, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const navigation = [
  { to: "/library", label: "Library", icon: Library },
  { to: "/articles/new", label: "Simpan artikel", icon: BookmarkPlus },
  { to: "/search", label: "Pencarian", icon: Search },
  { to: "/tags", label: "Tag", icon: Tags },
  { to: "/settings/profile", label: "Pengaturan", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/library" onClick={onNavigate} className="flex min-h-20 items-center gap-3 border-b border-[var(--border)] px-6">
        <BookOpen aria-hidden="true" />
        <span className="font-editorial text-2xl font-semibold">SimpanDulu</span>
      </Link>
      <nav aria-label="Navigasi utama" className="grid gap-1 p-3">
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
      <div className="mt-auto border-t border-[var(--border)] p-4">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
        <Button variant="ghost" className="mt-3 w-full justify-start" onClick={() => void logout()}>
          <LogOut className="size-4" aria-hidden="true" />Keluar
        </Button>
      </div>
    </div>
  );
}

// Menyediakan navigasi konsisten dan drawer aksesibel untuk seluruh route terproteksi.
export function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-20 bg-[var(--text)] px-4 py-2 text-white focus:translate-y-0">Lewati ke konten</a>
      <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)] lg:block"><SidebarContent /></aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[color:var(--cream)]/95 px-4 backdrop-blur-sm lg:px-8">
          <Button variant="ghost" className="px-3 lg:hidden" aria-label="Buka navigasi" aria-expanded={open} onClick={() => setOpen(true)}><Menu aria-hidden="true" /></Button>
          <Link to="/library" className="font-editorial text-xl font-semibold lg:hidden">SimpanDulu</Link>
          <span className="ml-auto hidden text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] sm:block">Pustaka bacaan pribadi</span>
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
