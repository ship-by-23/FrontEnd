import type { ReadingStatus } from "../../lib/api/types";
import { cn } from "../../lib/utils";
import { readingStatusLabel } from "../../lib/reading-progress";

export function ReadingProgress({
  percent,
  status,
  compact = false,
  showLabel = true,
}: {
  percent: number;
  status?: ReadingStatus;
  compact?: boolean;
  showLabel?: boolean;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const label = status ? readingStatusLabel(status) : `${value}% dibaca`;

  return (
    <div className={cn("grid gap-2", compact && "gap-1.5")}>
      {showLabel ? (
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={`Progress membaca ${value}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className={cn("h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]", compact && "h-1")}
      >
        <span className="block h-full rounded-full bg-[var(--success)] transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
