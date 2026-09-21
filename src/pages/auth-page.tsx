import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form-controls";
import { useAuth } from "../features/auth/auth-context";
import { ApiError, apiRequest } from "../lib/api/client";

type AuthPageProps = { mode: "login" | "register" };

// Memastikan tujuan setelah login tetap internal dan tidak menjadi open redirect.
function getSafeDestination(state: unknown) {
  if (typeof state === "object" && state && "from" in state && typeof state.from === "string" && state.from.startsWith("/")) return state.from;
  return "/library";
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const mutation = useMutation({
    mutationFn: () => apiRequest(`/auth/${mode}`, { method: "POST", retryUnauthorized: false, body: JSON.stringify(isRegister ? fields : { email: fields.email, password: fields.password }) }),
    onSuccess: async () => {
      await auth.refresh();
      navigate(getSafeDestination(location.state), { replace: true });
    },
  });

  if (auth.status === "authenticated") return <Navigate to="/library" replace />;
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  // Memvalidasi konfirmasi password sebelum request dikirim.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegister && fields.password !== fields.confirmPassword) return;
    mutation.mutate();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden border-r border-[var(--border)] bg-[var(--surface-muted)] p-12 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2 font-editorial text-2xl font-semibold"><BookOpen aria-hidden="true" />SimpanDulu</Link>
        <blockquote className="font-editorial max-w-xl text-5xl font-semibold leading-tight">“Bacaan terbaik tak harus diselesaikan pada saat ditemukan.”</blockquote>
        <p className="text-sm text-[var(--text-muted)]">Pustaka pribadi untuk perhatian yang lebih terjaga.</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" aria-hidden="true" />Kembali</Link>
          <h1 className="font-editorial text-5xl font-semibold">{isRegister ? "Buat akun" : "Selamat datang kembali"}</h1>
          <p className="mt-3 text-[var(--text-muted)]">{isRegister ? "Mulai susun pustaka bacaan pribadimu." : "Masuk untuk melanjutkan bacaanmu."}</p>
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
            {isRegister ? <Field label="Nama" htmlFor="name" error={apiError?.fields?.name}><Input id="name" autoComplete="name" required value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} /></Field> : null}
            <Field label="Email" htmlFor="email" error={apiError?.fields?.email}><Input id="email" type="email" autoComplete="email" required value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} /></Field>
            <Field label="Password" htmlFor="password" error={apiError?.fields?.password}><Input id="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} /></Field>
            {isRegister ? <Field label="Konfirmasi password" htmlFor="confirmPassword" error={fields.confirmPassword && fields.password !== fields.confirmPassword ? "Konfirmasi password belum sama." : undefined}><Input id="confirmPassword" type="password" autoComplete="new-password" required value={fields.confirmPassword} onChange={(event) => setFields({ ...fields, confirmPassword: event.target.value })} /></Field> : null}
            {mutation.isError ? <p role="alert" className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]">{apiError?.message ?? "Tidak dapat terhubung ke server. Coba lagi."}</p> : null}
            <Button type="submit" disabled={mutation.isPending || Boolean(isRegister && fields.confirmPassword && fields.password !== fields.confirmPassword)}>{mutation.isPending ? "Memproses…" : isRegister ? "Buat akun" : "Masuk"}</Button>
          </form>
          <p className="mt-6 text-sm text-[var(--text-muted)]">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link className="font-semibold text-[var(--text)] underline underline-offset-4" to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar"}</Link></p>
        </div>
      </section>
    </main>
  );
}
