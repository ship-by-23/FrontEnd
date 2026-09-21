export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
};

export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";
export type ReadingStatus = "unread" | "reading" | "finished";

export type Tag = { id: string; name: string };

export type ArticleSummary = {
  id: string;
  title: string | null;
  description?: string | null;
  siteName?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  estimatedReadingMinutes?: number | null;
  readingStatus: ReadingStatus;
  readingProgress?: number;
  isFavorite: boolean;
  isArchived: boolean;
  extractionStatus: ExtractionStatus;
  extractionErrorCode?: string | null;
  createdAt: string;
  tags?: Tag[];
};

export type Article = ArticleSummary & {
  submittedUrl: string;
  canonicalUrl?: string | null;
  publishedAt?: string | null;
  contentHtml?: string | null;
  wordCount?: number | null;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ArticleCollection = {
  data: ArticleSummary[];
  pagination: Pagination;
};
