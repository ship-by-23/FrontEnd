const SAFE_ELEMENTS = new Set([
  "a", "article", "aside", "blockquote", "br", "caption", "code", "col", "colgroup",
  "dd", "del", "details", "div", "dl", "dt", "em", "figcaption", "figure", "footer", "h1", "h2",
  "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "li", "main", "mark", "nav", "ol", "p", "pre",
  "q", "s", "section", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody",
  "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
]);

const SAFE_ATTRIBUTES = new Set([
  "alt", "class", "colspan", "datetime", "height", "id", "loading", "rel", "rowspan", "scope",
  "start", "target", "title", "width",
]);

const URL_ATTRIBUTES = new Set(["cite", "href", "src"]);

// Memastikan URL hasil ekstraksi tidak menjalankan protocol aktif atau mengirim resource ke tujuan berbahaya.
function isSafeArticleUrl(value: string, attribute: string) {
  try {
    const parsedUrl = new URL(value, document.baseURI);
    const allowedProtocols = attribute === "src" ? ["http:", "https:"] : ["http:", "https:", "mailto:"];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// Membersihkan ulang HTML artikel di browser sebelum boundary dangerouslySetInnerHTML digunakan.
export function sanitizeArticleHtml(value: string | null | undefined) {
  if (!value?.trim() || typeof DOMParser === "undefined") return "";

  const parsedDocument = new DOMParser().parseFromString(value, "text/html");
  parsedDocument.querySelectorAll("script, style, iframe, object, embed, form, base, meta, link, template, svg, math, video, audio").forEach((element) => {
    element.remove();
  });

  parsedDocument.body.querySelectorAll("*").forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    if (!SAFE_ELEMENTS.has(tagName)) {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isReaderAnchor = name === "data-reader-anchor";
      const isAriaAttribute = name.startsWith("aria-");

      if (name.startsWith("on") || name === "style" || name === "srcset" || name === "srcdoc" || name === "formaction") {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name.startsWith("data-") && !isReaderAnchor) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (URL_ATTRIBUTES.has(name) && !isSafeArticleUrl(attribute.value, name)) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (!SAFE_ATTRIBUTES.has(name) && !isReaderAnchor && !isAriaAttribute && !URL_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === "a") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
    if (tagName === "img") {
      element.setAttribute("loading", "lazy");
      element.setAttribute("referrerpolicy", "no-referrer");
      if (!element.hasAttribute("alt")) element.setAttribute("alt", "");
    }
  });

  return parsedDocument.body.innerHTML;
}
