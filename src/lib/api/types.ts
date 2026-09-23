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
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  user: User;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type AuthSessionResponse = { data: AuthSession };

export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";
export type ReadingStatus = "unread" | "reading" | "finished";

export type Tag = { id: string; name: string };

export type ArticleSummary = {
  id: string;
  submittedUrl?: string;
  canonicalUrl?: string | null;
  title: string | null;
  description?: string | null;
  siteName?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  wordCount?: number | null;
  estimatedReadingMinutes?: number | null;
  readingStatus: ReadingStatus;
  readingProgress?: number | null;
  isFavorite: boolean;
  isArchived: boolean;
  extractionStatus: ExtractionStatus;
  extractionErrorCode?: string | null;
  createdAt: string;
  updatedAt?: string;
  finishedAt?: string | null;
  rank?: number | null;
  snippet?: string | null;
  tags?: Tag[];
};

export type Article = ArticleSummary & {
  submittedUrl: string;
  contentHtml?: string | null;
  contentText?: string | null;
  readingAnchor?: string | null;
};

export type ArticleSubmission = {
  id: string;
  submittedUrl: string;
  extractionStatus: ExtractionStatus;
  extractionErrorCode?: string | null;
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
