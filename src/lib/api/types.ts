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

export type Tag = {
  id: string;
  name: string;
  normalizedName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ArticleSummary = {
  id: string;
  submittedUrl?: string;
  canonicalUrl?: string | null;
  title: string | null;
  description?: string | null;
  siteName?: string | null;
  snippet?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  wordCount?: number | null;
  estimatedReadingMinutes?: number | null;
  readingStatus: ReadingStatus;
  readingProgress?: number | null;
  readingAnchor?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  extractionStatus: ExtractionStatus;
  extractionErrorCode?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  finishedAt?: string | null;
  rank?: number | null;
  tags?: Tag[];
};

export type Article = ArticleSummary & {
  submittedUrl: string;
  contentHtml?: string | null;
  contentText?: string | null;
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

export type HighlightArticleReference = {
  id: string;
  title?: string | null;
  siteName?: string | null;
};

export type Highlight = {
  id: string;
  articleId: string;
  quote: string;
  prefix?: string | null;
  suffix?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  article?: HighlightArticleReference | null;
};
