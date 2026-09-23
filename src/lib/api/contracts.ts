import type {
  Article,
  ArticleCollection,
  ArticleSummary,
  Highlight,
  HighlightArticleReference,
  Pagination,
  Tag,
  User,
} from "./types";

export class ApiContractError extends Error {
  constructor(resource: string) {
    super(`Response ${resource} tidak sesuai contract API.`);
    this.name = "ApiContractError";
  }
}

// Memastikan nilai boundary API dapat dibaca sebagai object tanpa menggunakan any.
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

// Membaca string wajib atau menghentikan parsing sebelum nilai invalid masuk ke UI.
function requiredString(record: Record<string, unknown>, field: string, resource: string) {
  const value = record[field];
  if (typeof value !== "string" || !value.trim()) throw new ApiContractError(resource);
  return value;
}

// Membaca string nullable dari response tanpa mengubah nilai invalid menjadi data buatan.
function optionalString(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return value === null || value === undefined ? null : typeof value === "string" ? value : null;
}

// Membaca boolean wajib yang digunakan pada flag artikel dan session state.
function requiredBoolean(record: Record<string, unknown>, field: string, resource: string) {
  const value = record[field];
  if (typeof value !== "boolean") throw new ApiContractError(resource);
  return value;
}

// Membaca angka nullable sambil menolak nilai non-numerik dari API.
function optionalNumber(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return value === null || value === undefined ? null : typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Membaca array wajib dan memberi error contract yang aman ketika response rusak.
function requiredArray(value: unknown, resource: string): unknown[] {
  if (!Array.isArray(value)) throw new ApiContractError(resource);
  return value;
}

// Memastikan status extraction sesuai enum produk sebelum dipakai oleh polling dan Reader.
function parseExtractionStatus(value: unknown, resource: string): ArticleSummary["extractionStatus"] {
  if (value === "pending" || value === "processing" || value === "completed" || value === "failed") return value;
  throw new ApiContractError(resource);
}

// Memastikan status baca sesuai enum produk sebelum dipakai oleh filter dan progress.
function parseReadingStatus(value: unknown, resource: string): ArticleSummary["readingStatus"] {
  if (value === "unread" || value === "reading" || value === "finished") return value;
  throw new ApiContractError(resource);
}

// Membaca tag artikel dari response API tanpa membuat tag pengganti ketika field invalid.
function parseTag(value: unknown, resource = "tag"): Tag {
  const record = asRecord(value);
  if (!record) throw new ApiContractError(resource);
  return {
    id: requiredString(record, "id", resource),
    name: requiredString(record, "name", resource),
    normalizedName: optionalString(record, "normalizedName") ?? undefined,
    createdAt: optionalString(record, "createdAt") ?? undefined,
    updatedAt: optionalString(record, "updatedAt") ?? undefined,
  };
}

// Membaca ringkasan artikel sesuai field minimal yang diperlukan Library dan Search.
function parseArticleSummary(value: unknown, resource = "article summary"): ArticleSummary {
  const record = asRecord(value);
  if (!record) throw new ApiContractError(resource);

  const tagsValue = record.tags;
  if (tagsValue !== undefined && !Array.isArray(tagsValue)) throw new ApiContractError(resource);

  return {
    id: requiredString(record, "id", resource),
    title: optionalString(record, "title"),
    description: optionalString(record, "description"),
    siteName: optionalString(record, "siteName"),
    snippet: optionalString(record, "snippet"),
    author: optionalString(record, "author"),
    imageUrl: optionalString(record, "imageUrl"),
    estimatedReadingMinutes: optionalNumber(record, "estimatedReadingMinutes"),
    readingStatus: parseReadingStatus(record.readingStatus, resource),
    readingProgress: optionalNumber(record, "readingProgress"),
    readingAnchor: optionalString(record, "readingAnchor"),
    isFavorite: requiredBoolean(record, "isFavorite", resource),
    isArchived: requiredBoolean(record, "isArchived", resource),
    extractionStatus: parseExtractionStatus(record.extractionStatus, resource),
    extractionErrorCode: optionalString(record, "extractionErrorCode"),
    createdAt: requiredString(record, "createdAt", resource),
    updatedAt: optionalString(record, "updatedAt"),
    tags: tagsValue === undefined ? undefined : tagsValue.map((tag) => parseTag(tag, resource)),
  };
}

// Membaca detail article dengan content dan metadata tambahan yang tetap nullable.
function parseArticle(value: unknown): Article {
  const record = asRecord(value);
  if (!record) throw new ApiContractError("article detail");

  return {
    ...parseArticleSummary(record, "article detail"),
    submittedUrl: requiredString(record, "submittedUrl", "article detail"),
    canonicalUrl: optionalString(record, "canonicalUrl"),
    publishedAt: optionalString(record, "publishedAt"),
    contentHtml: optionalString(record, "contentHtml"),
    contentText: optionalString(record, "contentText"),
    wordCount: optionalNumber(record, "wordCount"),
    finishedAt: optionalString(record, "finishedAt"),
  };
}

// Membuka envelope data detail article yang disepakati backend.
export function parseArticleResponse(value: unknown): Article {
  const record = asRecord(value);
  return parseArticle(record?.data ?? value);
}

// Membaca pagination collection dan menolak angka yang tidak konsisten dengan contract.
function parsePagination(value: unknown, resource: string): Pagination {
  const record = asRecord(value);
  if (!record) throw new ApiContractError(resource);
  const fields = ["page", "pageSize", "totalItems", "totalPages"] as const;
  const parsed = fields.map((field) => {
    const fieldValue = record[field];
    const minimum = field === "page" || field === "pageSize" ? 1 : 0;
    return typeof fieldValue === "number" && Number.isInteger(fieldValue) && fieldValue >= minimum ? fieldValue : null;
  });
  if (parsed.some((fieldValue) => fieldValue === null)) throw new ApiContractError(resource);
  return {
    page: parsed[0] as number,
    pageSize: parsed[1] as number,
    totalItems: parsed[2] as number,
    totalPages: parsed[3] as number,
  };
}

// Membaca collection article tanpa mengisi item atau pagination ketika response kosong/rusak.
export function parseArticleCollection(value: unknown): ArticleCollection {
  const record = asRecord(value);
  if (!record) throw new ApiContractError("article collection");
  const items = requiredArray(record.data, "article collection");
  return {
    data: items.map((item) => parseArticleSummary(item)),
    pagination: parsePagination(record.pagination, "article collection pagination"),
  };
}

// Membaca response user aktif baik dari object langsung maupun envelope data.
export function parseUserResponse(value: unknown): User {
  const root = asRecord(value);
  const record = asRecord(root?.data) ?? root;
  if (!record) throw new ApiContractError("current user");
  const role = record.role;
  return {
    id: requiredString(record, "id", "current user"),
    name: requiredString(record, "name", "current user"),
    email: requiredString(record, "email", "current user"),
    role: role === "user" || role === "admin" ? role : undefined,
  };
}

// Membaca collection tag dari array langsung atau envelope data tanpa fallback dummy.
export function parseTagCollection(value: unknown): Tag[] | { data: Tag[]; pagination?: Pagination } {
  const record = asRecord(value);
  const items = Array.isArray(value) ? value : requiredArray(record?.data, "tag collection");
  if (Array.isArray(value)) return items.map((item) => parseTag(item));

  const pagination = record?.pagination === undefined ? undefined : parsePagination(record.pagination, "tag collection pagination");
  return pagination ? { data: items.map((item) => parseTag(item)), pagination } : { data: items.map((item) => parseTag(item)) };
}

// Membaca referensi article pada highlight agar daftar global tetap menunjukkan sumber yang aman.
function parseHighlightArticle(value: unknown): HighlightArticleReference | null {
  if (value === null || value === undefined) return null;
  const record = asRecord(value);
  if (!record) throw new ApiContractError("highlight article reference");
  return {
    id: requiredString(record, "id", "highlight article reference"),
    title: optionalString(record, "title"),
    siteName: optionalString(record, "siteName"),
  };
}

// Membaca satu highlight dan menjaga quote/context tetap typed sebelum dirender.
function parseHighlight(value: unknown): Highlight {
  const record = asRecord(value);
  if (!record) throw new ApiContractError("highlight");
  return {
    id: requiredString(record, "id", "highlight"),
    articleId: requiredString(record, "articleId", "highlight"),
    quote: requiredString(record, "quote", "highlight"),
    prefix: optionalString(record, "prefix"),
    suffix: optionalString(record, "suffix"),
    startOffset: optionalNumber(record, "startOffset"),
    endOffset: optionalNumber(record, "endOffset"),
    note: optionalString(record, "note"),
    createdAt: requiredString(record, "createdAt", "highlight"),
    updatedAt: optionalString(record, "updatedAt"),
    article: parseHighlightArticle(record.article),
  };
}

// Membaca collection highlight array/envelope dan mempertahankan pagination bila tersedia.
export function parseHighlightCollection(value: unknown) {
  const record = asRecord(value);
  const items = Array.isArray(value) ? value : requiredArray(record?.data, "highlight collection");
  const pagination = record?.pagination === undefined ? undefined : parsePagination(record.pagination, "highlight collection pagination");
  return {
    data: items.map((item) => parseHighlight(item)),
    pagination,
  };
}
