import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./form-controls";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

// Menyediakan input password dengan kontrol visibilitas yang dapat diakses keyboard.
export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} />
      <button
        type="button"
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[3px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
