import { Tag as TagIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Tag } from "../../lib/api/types";
import { createLocalTag, getLocalTagsForArticle, toggleLocalTag, useLocalTags } from "../../lib/local-tags";
import { Button } from "../ui/button";
import { Input } from "../ui/form-controls";

export function ArticleTags({ articleId, serverTags = [] }: { articleId: string; serverTags?: Tag[] }) {
  const localTags = useLocalTags();
  const assignedLocalTags = getLocalTagsForArticle(localTags, articleId);
  const [name, setName] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tag = createLocalTag(name);
    if (tag && !assignedLocalTags.some((item) => item.id === tag.id)) toggleLocalTag(articleId, tag.id);
    setName("");
  }

  return (
    <section className="mt-8 border-y border-[var(--border-muted)] py-5" aria-labelledby="article-tags-heading">
      <div className="flex flex-wrap items-center gap-2">
        <TagIcon className="size-4" aria-hidden="true" />
        <h2 id="article-tags-heading" className="text-sm font-semibold">Tag artikel</h2>
        <span className="text-xs text-[var(--text-muted)]">Tag ini hanya tersedia di perangkat ini.</span>
      </div>
      {serverTags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Tag artikel yang tersimpan">
          {serverTags.map((tag) => <span key={tag.id} className="rounded-full border border-[var(--border-muted)] px-3 py-1 text-xs">{tag.name}</span>)}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Tag perangkat">
        {localTags.map((tag) => {
          const selected = assignedLocalTags.some((item) => item.id === tag.id);
          return <button key={tag.id} type="button" aria-pressed={selected} onClick={() => toggleLocalTag(articleId, tag.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${selected ? "border-[var(--text)] bg-[var(--text)] text-[var(--surface)]" : "border-[var(--border-muted)] hover:bg-[var(--surface-muted)]"}`}>{tag.name}</button>;
        })}
      </div>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleCreate}>
        <Input aria-label="Nama tag baru" value={name} onChange={(event) => setName(event.target.value)} placeholder="Buat tag, misalnya Kuliah" maxLength={40} />
        <Button type="submit" variant="secondary" disabled={!name.trim()}>Tambah tag</Button>
      </form>
    </section>
  );
}
