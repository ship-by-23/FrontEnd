import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input, Select } from "../../components/ui/form-controls";
import type { Tag } from "../../lib/api/types";
import {
  LIBRARY_SORT_OPTIONS,
  type LibraryArchiveFilter,
  type LibraryFavoriteFilter,
  type LibraryUrlState,
} from "./library-utils";

type FilterName = "status" | "tagId" | "favorite" | "archived" | "sort";
type FilterFieldsProps = {
  state: LibraryUrlState;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: boolean;
  onChange: (name: FilterName, value: string) => void;
};

type LibraryToolbarProps = FilterFieldsProps & {
  searchValue: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onViewChange: (view: LibraryUrlState["view"]) => void;
  onClearFilters: () => void;
};

// Menampilkan seluruh filter data Library dengan label yang tetap terlihat dan dapat digunakan keyboard.
function FilterFields({ state, tags, tagsLoading, tagsError, onChange }: FilterFieldsProps) {
  const favoriteValue: LibraryFavoriteFilter = state.favorite;
  const archivedValue: LibraryArchiveFilter = state.archived;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label className="grid gap-2 text-sm font-semibold">
        Status baca
        <Select value={state.status ?? ""} onChange={(event) => onChange("status", event.target.value)}>
          <option value="">Semua status</option>
          <option value="unread">Belum dibaca</option>
          <option value="reading">Sedang dibaca</option>
          <option value="finished">Selesai</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Tag
        <Select value={state.tagId ?? ""} disabled={tagsLoading || tagsError} onChange={(event) => onChange("tagId", event.target.value)}>
          <option value="">{tagsError ? "Tag tidak tersedia" : tagsLoading ? "Memuat tag…" : "Semua tag"}</option>
          {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Favorit
        <Select value={favoriteValue === "favorite" ? "true" : ""} onChange={(event) => onChange("favorite", event.target.value)}>
          <option value="">Semua artikel</option>
          <option value="true">Favorit saja</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Arsip
        <Select value={archivedValue === "archived" ? "true" : archivedValue === "active" ? "false" : ""} onChange={(event) => onChange("archived", event.target.value)}>
          <option value="">Dengan dan tanpa arsip</option>
          <option value="false">Tidak diarsipkan</option>
          <option value="true">Diarsipkan</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Urutkan
        <Select value={state.sort} onChange={(event) => onChange("sort", event.target.value)}>
          {LIBRARY_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </label>
    </div>
  );
}

// Menyediakan toolbar desktop dan filter dialog mobile dengan satu model state yang sama.
export function LibraryToolbar({
  state,
  tags,
  tagsLoading,
  tagsError,
  searchValue,
  hasActiveFilters,
  onChange,
  onSearchChange,
  onViewChange,
  onClearFilters,
}: LibraryToolbarProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Membuka filter mobile tanpa memindahkan state filter ke global store.
  function openFilterDialog() {
    setFilterDialogOpen(true);
  }

  // Menutup filter mobile setelah user selesai meninjau pilihan.
  function closeFilterDialog() {
    setFilterDialogOpen(false);
  }

  return (
    <section className="my-6 border-y border-[var(--border)] py-4" aria-label="Kontrol library">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Cari di library</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
          <Input
            type="search"
            value={searchValue}
            className="pl-10"
            placeholder="Cari judul, deskripsi, atau isi…"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={openFilterDialog}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />Filter
          </Button>
          {hasActiveFilters ? <Button variant="ghost" onClick={onClearFilters}><X className="size-4" aria-hidden="true" />Bersihkan filter</Button> : null}
          <div className="flex border border-[var(--border)]" aria-label="Mode tampilan">
            <Button className="rounded-none border-0 px-3" variant={state.view === "grid" ? "primary" : "ghost"} aria-label="Tampilan grid" aria-pressed={state.view === "grid"} onClick={() => onViewChange("grid")}>
              <Grid2X2 className="size-4" aria-hidden="true" />
            </Button>
            <Button className="rounded-none border-0 px-3" variant={state.view === "list" ? "primary" : "ghost"} aria-label="Tampilan list" aria-pressed={state.view === "list"} onClick={() => onViewChange("list")}>
              <List className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden lg:block">
        <FilterFields state={state} tags={tags} tagsLoading={tagsLoading} tagsError={tagsError} onChange={onChange} />
      </div>

      <Dialog
        open={filterDialogOpen}
        title="Filter library"
        titleId="library-filter-dialog-title"
        description="Pilihan ini memengaruhi artikel yang diambil dari server."
        onClose={closeFilterDialog}
        size="wide"
      >
        <FilterFields state={state} tags={tags} tagsLoading={tagsLoading} tagsError={tagsError} onChange={onChange} />
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={closeFilterDialog}>Selesai</Button>
        </div>
      </Dialog>
    </section>
  );
}
