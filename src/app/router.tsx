/* eslint-disable react-refresh/only-export-components */
import { Navigate, Outlet, createBrowserRouter, useLocation, useRouteError } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppShell } from "../components/app-shell/app-shell";
import { ErrorState, LoadingState } from "../components/feedback/states";
import { Button } from "../components/ui/button";
import { useAuth } from "../features/auth/auth-context";
import { AuthProvider } from "../features/auth/auth-provider";
import { LandingPage } from "../pages/landing-page";
const AuthPage = lazy(() => import("../pages/auth-page").then((module) => ({ default: module.AuthPage })));
const LibraryPage = lazy(() => import("../pages/library-page").then((module) => ({ default: module.LibraryPage })));
const ReaderPage = lazy(() => import("../pages/reader-page").then((module) => ({ default: module.ReaderPage })));
const EditArticlePage = lazy(() => import("../pages/edit-article-page").then((module) => ({ default: module.EditArticlePage })));
const SaveArticlePage = lazy(() => import("../pages/save-article-page").then((module) => ({ default: module.SaveArticlePage })));
const SearchPage = lazy(() => import("../pages/search-page").then((module) => ({ default: module.SearchPage })));
const TagsPage = lazy(() => import("../pages/tags-page").then((module) => ({ default: module.TagsPage })));
const HighlightsPage = lazy(() => import("../pages/highlights-page").then((module) => ({ default: module.HighlightsPage })));
const TagDetailPage = lazy(() => import("../pages/tags-page").then((module) => ({ default: module.TagDetailPage })));
const SettingsPage = lazy(() => import("../pages/simple-pages").then((module) => ({ default: module.SettingsPage })));
const BookmarkletSettingsPage = lazy(() => import("../pages/bookmarklet-settings-page").then((module) => ({ default: module.BookmarkletSettingsPage })));
const NotFoundPage = lazy(() => import("../pages/simple-pages").then((module) => ({ default: module.NotFoundPage })));

// Menampilkan fallback stabil ketika bundle sebuah halaman dimuat pertama kali.
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState label="Memuat halaman…" />}>{children}</Suspense>;
}

// Membatasi pemeriksaan session pada halaman yang benar-benar memerlukan autentikasi.
function AuthBoundary() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

// Menahan route privat sampai status session diketahui tanpa menampilkan konten sesaat.
function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === "loading") return <main className="min-h-screen"><LoadingState label="Memeriksa sesi…" /></main>;
  if (auth.status === "error") return <main className="mx-auto max-w-xl p-6"><ErrorState title="Sesi tidak dapat diperiksa" message="Server belum dapat dihubungi. Data privat tidak ditampilkan." onRetry={() => void auth.refresh()} /></main>;
  if (auth.status === "unauthenticated") return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}

// Menampilkan kegagalan route tanpa membocorkan stack trace internal.
function RouteErrorBoundary() {
  const error = useRouteError();
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-lg"><ErrorState title="Halaman mengalami kendala" message={error instanceof Error ? error.message : "Terjadi kesalahan yang tidak dikenali."} /><Button className="mt-4" onClick={() => window.location.assign("/")}>Kembali ke awal</Button></div></main>;
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement: <RouteErrorBoundary /> },
  {
    element: <AuthBoundary />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/login", element: <LazyPage><AuthPage mode="login" /></LazyPage> },
      { path: "/register", element: <LazyPage><AuthPage mode="register" /></LazyPage> },
      {
        element: <ProtectedRoute />,
        children: [{
          element: <AppShell />,
          children: [
            { path: "/library", element: <LazyPage><LibraryPage /></LazyPage> },
            { path: "/articles/new", element: <LazyPage><SaveArticlePage /></LazyPage> },
            { path: "/articles/:articleId/edit", element: <LazyPage><EditArticlePage /></LazyPage> },
            { path: "/articles/:articleId", element: <LazyPage><ReaderPage /></LazyPage> },
            { path: "/search", element: <LazyPage><SearchPage /></LazyPage> },
            { path: "/tags", element: <LazyPage><TagsPage /></LazyPage> },
            { path: "/tags/:tagId", element: <LazyPage><TagDetailPage /></LazyPage> },
            { path: "/highlights", element: <LazyPage><HighlightsPage /></LazyPage> },
            { path: "/settings/profile", element: <LazyPage><SettingsPage section="profile" /></LazyPage> },
            { path: "/settings/appearance", element: <LazyPage><SettingsPage section="appearance" /></LazyPage> },
            { path: "/settings/security", element: <LazyPage><SettingsPage section="security" /></LazyPage> },
            { path: "/settings/bookmarklet", element: <LazyPage><BookmarkletSettingsPage /></LazyPage> },
          ],
        }],
      },
    ],
  },
  { path: "*", element: <LazyPage><NotFoundPage /></LazyPage> },
]);
