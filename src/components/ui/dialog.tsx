import { useEffect, useRef, type ReactNode, type SyntheticEvent } from "react";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "wide";
};

// Menyediakan dialog native dengan focus restore dan perilaku Escape yang dapat dipakai ulang secara terbatas.
export function Dialog({ open, title, description, titleId, onClose, children, size = "default" }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    if (open) {
      window.requestAnimationFrame(() => {
        const firstFocusable = dialog.querySelector<HTMLElement>("button, input, select, textarea, a[href]");
        firstFocusable?.focus();
      });
    }
  }, [open]);

  // Mengembalikan focus ke trigger setelah dialog ditutup agar keyboard user tidak kehilangan konteks.
  function handleClose() {
    previousFocus.current?.focus();
    if (open) onClose();
  }

  // Menutup dialog melalui Escape tanpa membiarkan browser mempertahankan state modal yang sudah tidak dipakai.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? `${titleId}-description` : undefined}
      className={[
        "m-auto max-h-[min(86vh,48rem)] w-[calc(100%-2rem)] overflow-y-auto border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--text)] shadow-[0.5rem_0.5rem_0_var(--accent)] backdrop:bg-black/45",
        size === "wide" ? "max-w-3xl" : "max-w-lg",
      ].join(" ")}
      onCancel={handleCancel}
      onClose={handleClose}
    >
      <div className="p-5 sm:p-7">
        <h2 id={titleId} className="font-editorial text-3xl font-semibold">{title}</h2>
        {description ? <p id={`${titleId}-description`} className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}
