import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Field, Input, PasswordField } from "../components/ui/form-controls";
import { AuthVisualPanel } from "../features/auth/components/auth-visual-panel";
import { useAuth } from "../features/auth/auth-context";
import { ThemeSwitch } from "../components/ui/theme-switch";
import { ApiError, apiRequest, setAccessToken } from "../lib/api/client";
import type { AuthSessionResponse } from "../lib/api/types";

type AuthPageProps = { mode: "login" | "register" };

type AuthFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;

const emptyFields: AuthFields = { name: "", email: "", password: "", confirmPassword: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Memvalidasi field login dan registrasi sebelum request dikirim ke API.
function validateAuthFields(fields: AuthFields, isRegister: boolean) {
  const errors: AuthFieldErrors = {};

  if (isRegister && !fields.name.trim()) errors.name = "Nama lengkap wajib diisi.";
  if (!fields.email.trim()) errors.email = "Email wajib diisi.";
  else if (!emailPattern.test(fields.email.trim())) errors.email = "Format email tidak valid.";
  if (!fields.password) errors.password = "Password wajib diisi.";
  else if (isRegister && fields.password.length < 8) errors.password = "Password minimal 8 karakter.";

  if (isRegister && !fields.confirmPassword) errors.confirmPassword = "Konfirmasi password wajib diisi.";
  else if (isRegister && fields.password !== fields.confirmPassword) errors.confirmPassword = "Password dan konfirmasi password tidak sama.";

  return errors;
}

// Mengubah kegagalan API menjadi pesan aman yang sesuai konteks autentikasi.
function getSubmissionErrorMessage(error: unknown, isRegister: boolean) {
  if (!(error instanceof ApiError)) return "Tidak dapat terhubung ke server. Coba lagi.";
  if (error.status === 401) return "Email atau password tidak sesuai.";
  if (isRegister && error.status === 409) return "Email sudah digunakan.";
  if (error.status >= 500) return "Tidak dapat terhubung ke server. Coba lagi.";
  return error.message || "Permintaan tidak dapat diproses. Silakan coba lagi.";
}

// Memastikan tujuan setelah login tetap internal dan tidak menjadi open redirect.
function getSafeDestination(state: unknown) {
  if (typeof state === "object" && state && "from" in state && typeof state.from === "string" && state.from.startsWith("/")) return state.from;
  return "/library";
}

// Menampilkan form autentikasi beserta visual editorial sesuai mode route.
export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState<AuthFields>(emptyFields);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const mutation = useMutation({
    mutationFn: () => {
      const body = isRegister
        ? { name: fields.name.trim(), email: fields.email.trim(), password: fields.password, passwordConfirmation: fields.confirmPassword }
        : { email: fields.email.trim(), password: fields.password };
      return apiRequest<AuthSessionResponse>(`/auth/${mode}`, { method: "POST", retryUnauthorized: false, body: JSON.stringify(body) });
    },
    onSuccess: async (response) => {
      if (isRegister) {
        setAccessToken(null);
        toast.success("Akun berhasil dibuat. Silakan masuk.");
        navigate("/login", { replace: true });
        return;
      }

      setAccessToken(response.data.accessToken);
      await auth.refresh();
      navigate(getSafeDestination(location.state), { replace: true });
    },
  });

  if (auth.status === "authenticated") return <Navigate to="/library" replace />;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const submissionError = mutation.isError ? getSubmissionErrorMessage(mutation.error, isRegister) : null;
  const nameError = fieldErrors.name ?? apiError?.fields?.name;
  const emailError = fieldErrors.email ?? apiError?.fields?.email;
  const passwordError = fieldErrors.password ?? apiError?.fields?.password;
  const confirmPasswordError = fieldErrors.confirmPassword ?? apiError?.fields?.passwordConfirmation ?? apiError?.fields?.confirmPassword;

  // Memperbarui field sekaligus menghapus error lama setelah pengguna mulai memperbaikinya.
  function updateField(field: keyof AuthFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "password" || field === "confirmPassword") delete next.confirmPassword;
      return next;
    });
    mutation.reset();
  }

  // Mengirim form setelah seluruh validasi frontend berhasil.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.reset();
    const nextErrors = validateAuthFields(fields, isRegister);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  }

  return (
    <main className="grid min-h-screen md:h-dvh md:min-h-0 md:overflow-hidden md:grid-cols-[42%_58%] lg:grid-cols-2">
      <AuthVisualPanel mode={mode} />
      <section className="flex min-w-0 items-start justify-center p-5 sm:p-10 md:min-h-0 md:overflow-y-auto md:py-10 lg:py-16">
        <div className="w-full max-w-md pb-8 md:pb-0">
          <div className="mb-12 flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" aria-hidden="true" />Kembali</Link>
            <ThemeSwitch />
          </div>
          <h1 className="font-editorial text-5xl font-semibold">{isRegister ? "Mulai daftar bacaanmu." : "Selamat datang kembali."}</h1>
          <p className="mt-3 text-[var(--text-muted)]">{isRegister ? "Buat akun untuk menyimpan dan mengelola artikel yang ingin kamu baca nanti." : "Masuk untuk melanjutkan bacaanmu."}</p>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
            {isRegister ? (
              <Field label="Nama Lengkap" htmlFor="name" error={nameError}>
                <Input id="name" name="name" autoComplete="name" required value={fields.name} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "name-error" : undefined} onChange={(event) => updateField("name", event.target.value)} />
              </Field>
            ) : null}
            <Field label="Email" htmlFor="email" error={emailError}>
              <Input id="email" name="email" type="email" autoComplete="email" required value={fields.email} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-error" : undefined} onChange={(event) => updateField("email", event.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password" error={passwordError}>
              <PasswordField id="password" name="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} required value={fields.password} aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? "password-error" : undefined} onChange={(event) => updateField("password", event.target.value)} />
            </Field>
            {isRegister ? (
              <Field label="Konfirmasi Password" htmlFor="confirmPassword" error={confirmPasswordError}>
                <PasswordField id="confirmPassword" name="confirmPassword" autoComplete="new-password" required value={fields.confirmPassword} aria-invalid={Boolean(confirmPasswordError)} aria-describedby={confirmPasswordError ? "confirmPassword-error" : undefined} onChange={(event) => updateField("confirmPassword", event.target.value)} />
              </Field>
            ) : null}
            {submissionError ? <p role="alert" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{submissionError}</p> : null}
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? (isRegister ? "Membuat akun..." : "Memproses...") : isRegister ? "Buat Akun" : "Masuk"}</Button>
          </form>
          <p className="mt-6 text-sm text-[var(--text-muted)]">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link className="font-semibold text-[var(--text)] underline underline-offset-4" to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar"}</Link></p>
        </div>
      </section>
    </main>
  );
}
