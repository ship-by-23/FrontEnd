import { useMutation } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Field, Input } from "../../components/ui/form-controls";
import { PasswordField } from "../../components/ui/password-field";
import { useAuth } from "../auth/auth-context";
import { updateCurrentPassword, updateCurrentUser } from "../auth/auth-api";
import { ApiError } from "../../lib/api/client";
import {
  getSettingsErrorMessage,
  validatePasswordForm,
  validateProfileForm,
  type PasswordField as PasswordFormField,
  type PasswordFormFields,
  type ProfileField,
  type ProfileFormFields,
  type SettingsFormErrors,
} from "./settings-utils";

// Menampilkan form profil berbasis data user aktif dan menyegarkan session setelah server berhasil menyimpan.
export function ProfileSettingsPanel() {
  const auth = useAuth();
  const user = auth.user;
  const [fields, setFields] = useState<ProfileFormFields>(() => ({ name: user?.name ?? "", email: user?.email ?? "" }));
  const [clientErrors, setClientErrors] = useState<SettingsFormErrors<ProfileField>>({});
  const [sessionError, setSessionError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateCurrentUser({ name: fields.name.trim(), email: fields.email.trim() }),
    onSuccess: async () => {
      setFields({ name: fields.name.trim(), email: fields.email.trim() });
      const result = await auth.refresh();
      setSessionError(result === "authenticated" ? null : "Profil tersimpan, tetapi sesi belum dapat disegarkan. Coba muat ulang halaman.");
    },
  });

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const serverErrors = apiError?.fields ?? {};
  const formError = sessionError ?? (mutation.error ? getSettingsErrorMessage(mutation.error, "profile") : null);

  // Mengubah field profil dan menghapus error yang sudah diperbaiki user.
  function updateField(field: ProfileField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    mutation.reset();
    setSessionError(null);
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  // Memvalidasi profil secara lokal sebelum mengirim perubahan ke API.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateProfileForm(fields);
    setClientErrors(errors);
    setSessionError(null);
    if (Object.keys(errors).length > 0 || mutation.isPending) return;
    mutation.mutate();
  }

  // Memilih error lokal terlebih dahulu lalu memakai field error dari API sebagai fallback.
  function getFieldError(field: ProfileField) {
    return clientErrors[field] ?? serverErrors[field];
  }

  if (!user) return null;

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" aria-labelledby="profile-form-title">
      <div className="flex flex-col gap-3 border-b border-[var(--border-muted)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Identitas akun</p>
          <h2 id="profile-form-title" className="font-editorial mt-2 text-4xl font-semibold">Profil</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Perbarui nama dan email yang digunakan pada akunmu.</p>
        </div>
        {user.role ? <p className="text-sm text-[var(--text-muted)]">Peran: <span className="font-semibold text-[var(--text)]">{user.role}</span></p> : null}
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate aria-busy={mutation.isPending}>
        <Field label="Nama" htmlFor="profile-name" error={getFieldError("name")}>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            required
            value={fields.name}
            aria-invalid={Boolean(getFieldError("name"))}
            aria-describedby={getFieldError("name") ? "profile-name-error" : undefined}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email" error={getFieldError("email")}>
          <Input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            aria-invalid={Boolean(getFieldError("email"))}
            aria-describedby={getFieldError("email") ? "profile-email-error" : undefined}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </Field>
        {formError ? <p className="border-l-2 border-[var(--danger)] pl-3 text-sm leading-6 text-[var(--danger)]" role="alert">{formError}</p> : null}
        {!formError && mutation.isSuccess ? <p className="text-sm text-[var(--success)]" role="status" aria-live="polite">Profil berhasil diperbarui.</p> : null}
        <div className="flex flex-wrap gap-3 border-t border-[var(--border-muted)] pt-5">
          <Button type="submit" disabled={mutation.isPending}><Save className="size-4" aria-hidden="true" />{mutation.isPending ? "Menyimpan…" : "Simpan profil"}</Button>
        </div>
      </form>
    </section>
  );
}

// Menampilkan form ganti password dan aksi logout tanpa menyimpan credential di storage atau state global.
export function SecuritySettingsPanel() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<PasswordFormFields>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [clientErrors, setClientErrors] = useState<SettingsFormErrors<PasswordFormField>>({});
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateCurrentPassword(fields),
    onSuccess: () => {
      setFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
  });

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const serverErrors = apiError?.fields ?? {};
  const formError = mutation.error ? getSettingsErrorMessage(mutation.error, "password") : null;

  // Mengubah field password dan membersihkan error terkait tanpa mempertahankan nilai credential setelah submit sukses.
  function updateField(field: PasswordFormField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    mutation.reset();
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  // Memvalidasi password baru dan konfirmasi sebelum request dikirim ke backend.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validatePasswordForm(fields);
    setClientErrors(errors);
    if (Object.keys(errors).length > 0 || mutation.isPending) return;
    mutation.mutate();
  }

  // Memilih pesan validasi lokal atau field error server untuk input password.
  function getFieldError(field: PasswordFormField) {
    return clientErrors[field] ?? serverErrors[field];
  }

  // Mengakhiri session lokal dan mengarahkan user ke login meskipun pencabutan server gagal.
  async function handleLogout() {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError(null);
    const succeeded = await auth.logout();
    setLogoutPending(false);
    if (!succeeded) setLogoutError("Kamu sudah keluar dari perangkat ini. Silakan coba lagi jika akun masih terlihat.");
    navigate("/login", { replace: true });
  }

  return (
    <div className="grid gap-5">
      <section className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" aria-labelledby="password-form-title">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Keamanan akun</p>
        <h2 id="password-form-title" className="font-editorial mt-2 text-4xl font-semibold">Ubah password</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Masukkan password saat ini untuk mengonfirmasi perubahan.</p>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate aria-busy={mutation.isPending}>
          <Field label="Password saat ini" htmlFor="current-password" error={getFieldError("currentPassword")}>
            <PasswordField
              id="current-password"
              name="currentPassword"
              autoComplete="current-password"
              required
              value={fields.currentPassword}
              aria-invalid={Boolean(getFieldError("currentPassword"))}
              aria-describedby={getFieldError("currentPassword") ? "current-password-error" : undefined}
              onChange={(event) => updateField("currentPassword", event.target.value)}
            />
          </Field>
          <Field label="Password baru" htmlFor="new-password" error={getFieldError("newPassword")}>
            <PasswordField
              id="new-password"
              name="newPassword"
              autoComplete="new-password"
              required
              value={fields.newPassword}
              aria-invalid={Boolean(getFieldError("newPassword"))}
              aria-describedby={getFieldError("newPassword") ? "new-password-error" : undefined}
              onChange={(event) => updateField("newPassword", event.target.value)}
            />
          </Field>
          <Field label="Konfirmasi password baru" htmlFor="confirm-new-password" error={getFieldError("confirmPassword")}>
            <PasswordField
              id="confirm-new-password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={fields.confirmPassword}
              aria-invalid={Boolean(getFieldError("confirmPassword"))}
              aria-describedby={getFieldError("confirmPassword") ? "confirm-new-password-error" : undefined}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
            />
          </Field>
          {formError ? <p className="border-l-2 border-[var(--danger)] pl-3 text-sm leading-6 text-[var(--danger)]" role="alert">{formError}</p> : null}
          {mutation.isSuccess ? <p className="text-sm text-[var(--success)]" role="status" aria-live="polite">Password berhasil diubah.</p> : null}
          <div className="flex flex-wrap gap-3 border-t border-[var(--border-muted)] pt-5">
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Mengubah…" : "Ubah password"}</Button>
          </div>
        </form>
      </section>

      <section className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8" aria-labelledby="logout-title">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Akun</p>
        <h2 id="logout-title" className="font-editorial mt-2 text-4xl font-semibold">Keluar dari akun</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Keluar untuk mengakhiri akses akunmu di aplikasi ini.</p>
        {logoutError ? <p className="mt-4 text-sm text-[var(--warning)]" role="status">{logoutError}</p> : null}
        <Button className="mt-6" variant="secondary" disabled={logoutPending} onClick={() => void handleLogout()}>
          <LogOut className="size-4" aria-hidden="true" />{logoutPending ? "Keluar…" : "Keluar"}
        </Button>
      </section>
    </div>
  );
}
