import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { getAppConfig } from "./lib/config";
import "./styles/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemen root aplikasi tidak ditemukan.");
}

let application: React.ReactNode;

try {
  getAppConfig();
  application = (
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Konfigurasi aplikasi belum lengkap.";
  application = (
    <main className="grid min-h-screen place-items-center bg-[var(--cream)] p-6 text-[var(--text)]">
      <section className="max-w-xl border border-[var(--danger)] bg-[var(--surface)] p-6" role="alert">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--danger)]">Konfigurasi belum siap</p>
        <h1 className="font-editorial mt-2 text-4xl font-semibold">Aplikasi tidak dapat dijalankan</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{message}</p>
      </section>
    </main>
  );
}

createRoot(root).render(application);
