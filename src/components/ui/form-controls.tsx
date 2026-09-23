import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-[3px] border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)] disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

// Menyediakan input password dengan toggle visibilitas yang tetap mempertahankan focus.
export const PasswordField = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(function PasswordField(
  { className, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  // Mengubah visibilitas password tanpa mengubah nilai field.
  function handleTogglePassword() {
    setShowPassword((current) => !current);
  }

  return (
    <div className="relative">
      <Input ref={ref} type={showPassword ? "text" : "password"} className={cn("pr-12", className)} {...props} />
      <button
        type="button"
        className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[3px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={showPassword}
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleTogglePassword}
      >
        {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "min-h-11 rounded-[3px] border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}
