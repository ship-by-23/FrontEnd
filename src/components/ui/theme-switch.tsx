import { Moon, Sun } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../features/theme/theme-context";

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Mode gelap"
      title={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-9 w-[4.5rem] shrink-0 items-center overflow-hidden rounded-full border border-[var(--border-muted)] bg-[var(--surface)] p-1 text-xs text-[var(--text)] shadow-[inset_0_1px_2px_rgba(28,28,26,0.08)] transition-all hover:border-[var(--border)] hover:shadow-[0_3px_0_var(--border)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute left-2.5 grid size-4 place-items-center text-[var(--text-muted)] transition-colors group-hover:text-[var(--text)]"><Sun className="size-3.5" /></span>
      <span aria-hidden="true" className="absolute right-2.5 grid size-4 place-items-center text-[var(--text-muted)] transition-colors group-hover:text-[var(--text)]"><Moon className="size-3.5" /></span>
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-[var(--text)] text-[var(--surface)] shadow-[0_2px_6px_rgba(28,28,26,0.24)] transition-transform duration-200 ease-out group-hover:scale-105",
          isDark && "translate-x-9",
        )}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
    </button>
  );
}
