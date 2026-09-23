import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

export type SettingsSection = "profile" | "appearance" | "security" | "bookmarklet";

const settingsLinks: Array<{ section: SettingsSection; label: string; to: string }> = [
  { section: "profile", label: "Profil", to: "/settings/profile" },
  { section: "appearance", label: "Tampilan", to: "/settings/appearance" },
  { section: "security", label: "Keamanan", to: "/settings/security" },
  { section: "bookmarklet", label: "Bookmarklet", to: "/settings/bookmarklet" },
];

// Menyediakan navigasi antar-subbagian settings dengan state aktif yang jelas dan aksesibel.
export function SettingsNavigation({ active }: { active: SettingsSection }) {
  return (
    <nav aria-label="Navigasi pengaturan" className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      {settingsLinks.map((link) => (
        <NavLink
          key={link.section}
          to={link.to}
          className={({ isActive }) => cn(
            "inline-flex min-h-10 items-center border px-3 text-sm font-semibold transition-colors",
            isActive || link.section === active
              ? "border-[var(--border)] bg-[var(--text)] text-[var(--surface)]"
              : "border-[var(--border-muted)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]",
          )}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
