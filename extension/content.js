const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { enabled: true, allowLinks: false, minimal: true, blockMedia: true, blockTracking: true };
const root = document.documentElement;

// Styles für das Innere (Shadow DOM) von Reddit-Elementen – dort greift normales CSS nicht.
// Schlüssel: Element, in dessen Shadow DOM die Styles eingefügt werden.
const HIDE = "{ display: none !important; }";
const SHADOW_CSS = {
  // Aktionsleiste der Posts
  "shreddit-post": `
    [data-post-click-location="vote"],
    button[upvote], button[downvote],
    [name="comments-action-button"],
    shreddit-post-share-button, award-button,
    slot[name="share-button"], slot[name="comment-button"], slot[name="award-button"],
    faceplate-number ${HIDE}`,
  // Profilbilder bei Kommentaren
  "shreddit-comment": `slot[name="commentAvatar"], [slot="commentAvatar"], [slot="commentAvatar"] * ${HIDE}`,
  // Subreddit-Icon in der Suchleiste (auf Subreddit- und Post-Seiten)
  "reddit-search-large, reddit-search-small, faceplate-search-input, search-dynamic-id-cache-controller":
    `img, faceplate-img, shreddit-subreddit-icon ${HIDE}`,
};
const SHADOW_HOSTS = Object.keys(SHADOW_CSS).join(", ");
const shadowStyles = new Set();

function apply(s) {
  root.dataset.rto = !s.enabled ? "off" : s.allowLinks ? "links" : "strict";
  const minimal = s.minimal; // unabhängig vom Filter
  root.toggleAttribute("data-rto-min", minimal);
  for (const st of shadowStyles) st.media = minimal ? "all" : "not all";
}

// Sofort anwenden (kein Aufblitzen), dann gespeicherte Einstellungen laden
let settings = DEFAULTS;
apply(settings);
api.storage.local.get(DEFAULTS).then((s) => apply((settings = s)));
api.storage.onChanged.addListener(() =>
  api.storage.local.get(DEFAULTS).then((s) => apply((settings = s)))
);

const fmt = (n) => Number(n || 0).toLocaleString("de-DE");

const SVG_NS = "http://www.w3.org/2000/svg";

// Pfeil nach oben, so hoch wie der Text und in Textfarbe (siehe minimal.css)
function upArrow() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-label", "Upvotes");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M8 1 2 8h4v7h4V8h4z");
  svg.append(path);
  return svg;
}

function metaLine(score, comments, href) {
  const div = document.createElement("div");
  div.className = "rto-meta";
  const a = document.createElement("a");
  a.href = href || "#";
  a.append(upArrow(), ` ${fmt(score)} · ${fmt(comments)} Kommentare`);
  div.append(a);
  return div;
}

// ---------------------------------------------------------------------------
// Bearbeitung der Seite. Jedes Element wird nur einmal angefasst; nach dem
// Laden werden nur neu eingefügte Teile der Seite durchsucht, nicht alles.
// ---------------------------------------------------------------------------

const styled = new WeakSet(); // Shadow DOM hat schon unsere Styles
const handled = new WeakSet(); // Post/Medien schon bearbeitet
const tries = new WeakMap();
const NESTED_HOSTS = "reddit-search-large, reddit-search-small";

function styleShadow(host) {
  if (styled.has(host)) return;
  const sr = host.openOrClosedShadowRoot ?? host.shadowRoot;
  if (!sr) {
    // Element noch nicht fertig aufgebaut: ein paarmal später erneut versuchen
    const n = tries.get(host) ?? 0;
    if (n < 3) {
      tries.set(host, n + 1);
      setTimeout(() => styleShadow(host), 200 * 3 ** n);
    }
    return;
  }
  styled.add(host);
  const css = Object.entries(SHADOW_CSS)
    .filter(([sel]) => host.matches(sel))
    .map(([, c]) => c)
    .join("\n");
  const st = document.createElement("style");
  st.dataset.rto = "";
  st.textContent = css;
  st.media = root.hasAttribute("data-rto-min") ? "all" : "not all";
  sr.append(st);
  shadowStyles.add(st);
  if (shadowStyles.size % 500 === 0) {
    for (const s of shadowStyles) if (!s.isConnected) shadowStyles.delete(s);
  }
  // Nur die Suchleiste hat weitere Reddit-Elemente in ihrem Shadow DOM
  if (host.matches(NESTED_HOSTS)) {
    processTree(sr);
    observer.observe(sr, { childList: true, subtree: true });
  }
}

function processPost(post) {
  if (handled.has(post)) return;
  handled.add(post);
  // Umgebendes <article> markieren, damit filter.css es ohne :has() ausblenden kann
  const article = post.parentElement;
  if (article?.localName === "article") {
    article.dataset.rtoPost =
      post.localName === "shreddit-ad-post" ? "ad" : post.getAttribute("post-type") || "";
  }
  if (post.hasAttribute("score")) {
    post.after(metaLine(post.getAttribute("score"), post.getAttribute("comment-count"), post.getAttribute("permalink")));
  }
}

function processOldReddit(thing) {
  if (handled.has(thing)) return;
  handled.add(thing);
  const tagline = thing.querySelector(".entry .tagline");
  tagline?.after(metaLine(thing.dataset.score, thing.dataset.commentsCount, thing.dataset.permalink));
}

// Elemente um den Feed herum markieren, damit minimal.css ihr Spalten-Layout
// ohne das teure body :has(#main-content) auflösen kann
function markLayout(main) {
  for (let el = main.parentElement; el && el !== document.body; el = el.parentElement) {
    el.setAttribute("data-rto-wrap", "");
  }
}

// Kommentare mit Bildern oder Videos einklappen – auf jeder Ebene, aber nur den
// Kommentar selbst. Antworten darunter bleiben sichtbar. Ein Klick auf den
// Hinweis zeigt den Kommentar wieder an.
const MEDIA = "img, video, shreddit-player, shreddit-player-2, figure";
const NOT_CONTENT = '[slot="commentAvatar"], [slot="commentMeta"], author-flair-event-handler';

function hideMediaInComment(el) {
  if (handled.has(el)) return;
  handled.add(el);
  const comment = el.closest("shreddit-comment");
  if (!comment || el.closest(NOT_CONTENT)) return;
  // Das direkte Kind des Kommentars finden, das die Medien enthält
  let part = el;
  while (part.parentElement !== comment) part = part.parentElement;
  if (part.hasAttribute("data-rto-hidden") || part.hasAttribute("data-rto-shown")) return;
  part.setAttribute("data-rto-hidden", "");
  const btn = document.createElement("button");
  btn.className = "rto-show";
  btn.type = "button";
  btn.slot = part.slot; // landet an derselben Stelle wie der Kommentartext
  btn.textContent = "Kommentar mit Bild/Video ausgeblendet – anzeigen";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    part.removeAttribute("data-rto-hidden");
    part.setAttribute("data-rto-shown", "");
    btn.remove();
  });
  part.before(btn);
}

function each(node, selector, fn) {
  if (node.nodeType === Node.ELEMENT_NODE && node.matches(selector)) fn(node);
  node.querySelectorAll(selector).forEach(fn);
}

function processTree(node) {
  each(node, SHADOW_HOSTS, styleShadow);
  each(node, "shreddit-post, shreddit-ad-post", processPost);
  each(node, MEDIA, hideMediaInComment);
  each(node, "#siteTable > .thing.link", processOldReddit);
  each(node, "#main-content", markLayout);
}

// Eigene Einfügungen lösen keine neue Bearbeitung aus
const isOwn = (n) =>
  n.nodeType !== Node.ELEMENT_NODE ||
  n.classList.contains("rto-meta") ||
  n.classList.contains("rto-show") ||
  n.classList.contains("rto-selflink") ||
  n.hasAttribute("data-rto");

let loading = document.readyState === "loading";
const pending = new Set();
let scheduled = false;

// Auf Subreddit-Seiten einen Link „Nur Text-Posts“ anbieten: Reddits Suche mit
// self:yes liefert vom Server ausschließlich Text-Posts.
const SUB_FEED = /^\/r\/([^/]+)\/?(?:hot|new|top|rising|best)?\/?$/;

function updateSelfLink() {
  const sub = location.pathname.match(SUB_FEED)?.[1];
  const old = document.querySelector(".rto-selflink");
  if (old && old.dataset.sub !== sub) old.remove();
  if (!sub || document.querySelector(".rto-selflink")) return;
  const target = document.querySelector("#main-content, #siteTable");
  if (!target) return;
  const div = document.createElement("div");
  div.className = "rto-selflink";
  div.dataset.sub = sub;
  const a = document.createElement("a");
  a.href = `/r/${sub}/search/?q=self%3Ayes&restrict_sr=1&sort=new`;
  a.textContent = `Nur Text-Posts aus r/${sub} (neueste zuerst)`;
  div.append(a);
  target.prepend(div);
}

function flush() {
  scheduled = false;
  updateSelfLink();
  if (loading) {
    processTree(document);
  } else {
    for (const n of pending) if (n.isConnected) processTree(n);
  }
  pending.clear();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  // Während des Ladens höchstens alle 150 ms die ganze Seite, danach pro Frame nur Neues
  if (loading) setTimeout(flush, 150);
  else requestAnimationFrame(flush);
}

const observer = new MutationObserver((records) => {
  if (!loading) {
    for (const r of records) for (const n of r.addedNodes) if (!isOwn(n)) pending.add(n);
    if (!pending.size) return;
  }
  schedule();
});
observer.observe(root, { childList: true, subtree: true });

if (loading) {
  document.addEventListener("DOMContentLoaded", () => {
    loading = false;
    pending.clear();
    processTree(document);
    updateSelfLink();
  }, { once: true });
} else {
  processTree(document);
  updateSelfLink();
}
