export const BOOKMARKLET_SAVE_PATH = "/articles/new";

// Menghasilkan URL dasar Save Article pada origin aplikasi tanpa membawa credential apa pun.
export function getBookmarkletTargetUrl(appOrigin: string): string {
  return new URL(BOOKMARKLET_SAVE_PATH, appOrigin).toString();
}

// Membentuk URL Save Article sambil mempertahankan query dan hash dari halaman asal.
export function buildSaveArticleUrl(appOrigin: string, pageUrl: string): string {
  const target = new URL(getBookmarkletTargetUrl(appOrigin));
  target.searchParams.set("url", pageUrl);
  return target.toString();
}

// Membuat source bookmarklet yang hanya membaca URL halaman aktif dan melakukan handoff ke aplikasi.
export function createBookmarkletSource(appOrigin: string): string {
  const targetUrl = JSON.stringify(getBookmarkletTargetUrl(appOrigin));
  const source = `(()=>{const t=${targetUrl};const u=window.location.href;const d=t+"?url="+encodeURIComponent(u);const w=window.open(d,"_blank","noopener,noreferrer");if(!w)window.location.assign(d);void 0})()`;
  return `javascript:${source}`;
}
