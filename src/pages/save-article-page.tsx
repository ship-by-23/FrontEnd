import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookmarkPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Field, Input } from "../components/ui/form-controls";
import { ApiError, apiRequest } from "../lib/api/client";
import type { Article } from "../lib/api/types";

type ArticleResponse = Article | { data: Article };

export function SaveArticlePage() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => apiRequest<ArticleResponse>("/articles", { method: "POST", body: JSON.stringify({ url }) }),
    onSuccess: (response) => {
      const article = "data" in response ? response.data : response;
      navigate(`/articles/${article.id}`);
    },
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  // Mengirim URL publik setelah validasi dasar browser; backend tetap menjadi boundary keamanan.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Artikel baru</p>
      <h1 className="font-editorial mt-2 text-5xl font-semibold">Simpan untuk nanti</h1>
      <p className="mt-4 leading-7 text-[var(--text-muted)]">Tempel URL artikel publik. SimpanDulu akan mengambil dan membersihkan isinya untuk pengalaman membaca yang lebih tenang.</p>
      <form onSubmit={handleSubmit} className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
        <Field label="URL artikel" htmlFor="article-url" error={apiError?.fields?.url}>
          <Input id="article-url" type="url" inputMode="url" placeholder="https://contoh.com/artikel" required value={url} onChange={(event) => setUrl(event.target.value)} />
        </Field>
        {mutation.isError ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{apiError?.message ?? "Artikel tidak dapat disimpan. Periksa koneksi dan coba lagi."}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3"><Button type="submit" disabled={mutation.isPending}><BookmarkPlus className="size-4" aria-hidden="true" />{mutation.isPending ? "Menyimpan…" : "Simpan artikel"}</Button><Button variant="ghost" onClick={() => navigate(-1)}>Batal</Button></div>
      </form>
      <p className="mt-6 text-sm text-[var(--text-muted)]">Dengan menyimpan URL, kamu memastikan halaman tersebut boleh kamu akses. <Link to="/settings/bookmarklet" className="font-semibold underline">Pelajari bookmarklet</Link>.</p>
    </div>
  );
}
