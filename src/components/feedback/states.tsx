import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "../ui/button";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-[var(--text-muted)]" role="status">
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <section className="grid min-h-64 place-items-center border border-dashed border-[var(--border-muted)] bg-[var(--surface)] p-8 text-center">
      <div className="max-w-md">
        <Inbox className="mx-auto mb-4 size-8" aria-hidden="true" />
        <h2 className="font-editorial text-3xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </section>
  );
}

export function ErrorState({ title = "Data tidak dapat dimuat", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <section className="border border-[var(--danger)] bg-[var(--surface)] p-6" role="alert">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
          {onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Coba lagi</Button> : null}
        </div>
      </div>
    </section>
  );
}
