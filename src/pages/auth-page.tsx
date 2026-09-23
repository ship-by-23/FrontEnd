import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form-controls";
import { PasswordField } from "../components/ui/password-field";
import { ThemeSwitch } from "../components/ui/theme-switch";
import { useAuth } from "../features/auth/auth-context";
import { loginUser, registerUser } from "../features/auth/auth-api";
import { AuthVisualPanel } from "../features/auth/components/auth-visual-panel";
import { getAuthErrorMessage, getAuthNotice, getSafeDestination, validateAuthForm, type AuthField, type AuthFormErrors, type AuthFormFields } from "../features/auth/auth-utils";
import { ApiError } from "../lib/api/client";

type AuthPageProps = { mode: "login" | "register" };

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState<AuthFormFields>({ name: "", email: "", password: "", confirmPassword: "" });
  const [clientErrors, setClientErrors] = useState<AuthFormErrors>({});
  const [sessionError, setSessionError] = useState<string | null>(null);
  const destination = getSafeDestination(location.state);

  const mutation = useMutation({
    mutationFn: () => isRegister ? registerUser({
        name: fields.name.trim(),
        email: fields.email.trim(),
        password: fields.password,
        confirmPassword: fields.confirmPassword,
      }) : loginUser({
        email: fields.email.trim(),
        password: fields.password,
      }),
    onSuccess: async () => {
      setSessionError(null);
      const sessionResult = await auth.refresh();
      if (sessionResult === "authenticated") {
        navigate(destination, { replace: true });
        return;
      }
      if (isRegister) {
        navigate("/login", {
          replace: true,
          state: { from: destination, notice: "Akun berhasil dibuat. Silakan masuk untuk melanjutkan." },
        });
        return;
      }
      setSessionError("Login berhasil diproses, tetapi sesi belum dapat diverifikasi. Coba lagi.");
    },
  });

  if (auth.status === "authenticated") return <Navigate to={destination} replace />;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const serverErrors = apiError?.fields ?? {};
  const notice = getAuthNotice(location.state);
  const formError = sessionError ?? (mutation.error ? getAuthErrorMessage(mutation.error, mode) : null);

  // Memperbarui satu field dan menghapus error lokal yang sudah diperbaiki user.
  function updateField(field: AuthField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    mutation.reset();
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSessionError(null);
  }

  // Memilih error lokal terlebih dahulu lalu menggunakan field error dari API sebagai fallback.
  function getFieldError(field: AuthField) {
    return clientErrors[field] ?? serverErrors[field];
  }

  // Memvalidasi konfirmasi password sebelum request dikirim.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateAuthForm(fields, mode);
    setClientErrors(errors);
    setSessionError(null);
    if (Object.keys(errors).length > 0) return;
    mutation.mutate();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <AuthVisualPanel mode={mode} />
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" aria-hidden="true" />Kembali</Link>
            <ThemeSwitch />
          </div>
          <h1 className="font-editorial text-5xl font-semibold">{isRegister ? "Buat akun" : "Selamat datang kembali"}</h1>
          <p className="mt-3 text-[var(--text-muted)]">{isRegister ? "Mulai susun pustaka bacaan pribadimu." : "Masuk untuk melanjutkan bacaanmu."}</p>
          {notice ? <p className="border-l-2 border-[var(--success)] pl-3 text-sm text-[var(--success)]" role="status">{notice}</p> : null}
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate aria-busy={mutation.isPending}>
            {isRegister ? <Field label="Nama" htmlFor="name" error={getFieldError("name")}><Input id="name" name="name" autoComplete="name" required value={fields.name} aria-invalid={Boolean(getFieldError("name"))} aria-describedby={getFieldError("name") ? "name-error" : undefined} onChange={(event) => updateField("name", event.target.value)} /></Field> : null}
            <Field label="Email" htmlFor="email" error={getFieldError("email")}><Input id="email" name="email" type="email" autoComplete="email" required value={fields.email} aria-invalid={Boolean(getFieldError("email"))} aria-describedby={getFieldError("email") ? "email-error" : undefined} onChange={(event) => updateField("email", event.target.value)} /></Field>
            <Field label="Password" htmlFor="password" error={getFieldError("password")}><PasswordField id="password" name="password" autoComplete={isRegister ? "new-password" : "current-password"} required value={fields.password} aria-invalid={Boolean(getFieldError("password"))} aria-describedby={getFieldError("password") ? "password-error" : undefined} onChange={(event) => updateField("password", event.target.value)} /></Field>
            {isRegister ? <Field label="Konfirmasi password" htmlFor="confirmPassword" error={getFieldError("confirmPassword")}><PasswordField id="confirmPassword" name="confirmPassword" autoComplete="new-password" required value={fields.confirmPassword} aria-invalid={Boolean(getFieldError("confirmPassword"))} aria-describedby={getFieldError("confirmPassword") ? "confirmPassword-error" : undefined} onChange={(event) => updateField("confirmPassword", event.target.value)} /></Field> : null}
            {formError ? <p role="alert" aria-live="assertive" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{formError}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Memproses…" : isRegister ? "Buat akun" : "Masuk"}</Button>
          </form>
          <p className="mt-6 text-sm text-[var(--text-muted)]">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link className="font-semibold text-[var(--text)] underline underline-offset-4" to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar"}</Link></p>
        </div>
      </section>
    </main>
  );
}
