const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { enabled: true, allowLinks: false, minimal: true };
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
  "shreddit-comment": `slot[name="commentAvatar"] ${HIDE}`,
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

const observed = new WeakSet();

function styleShadow(host) {
  const sr = host.openOrClosedShadowRoot ?? host.shadowRoot;
  if (!sr) return;
  if (!sr.querySelector(":scope > style[data-rto]")) {
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
  }
  // Verschachtelte Elemente (z. B. Suchfeld in der Suchleiste) liegen im Shadow DOM
  scanIn(sr);
  if (!observed.has(sr)) {
    observed.add(sr);
    observer.observe(sr, { childList: true, subtree: true });
  }
}

function addMeta(post) {
  if (!post.dataset.rtoMeta && post.hasAttribute("score")) {
    post.dataset.rtoMeta = "1";
    post.after(metaLine(post.getAttribute("score"), post.getAttribute("comment-count"), post.getAttribute("permalink")));
  }
}

function processOldReddit(thing) {
  if (thing.dataset.rtoMeta) return;
  thing.dataset.rtoMeta = "1";
  const tagline = thing.querySelector(".entry .tagline");
  tagline?.after(metaLine(thing.dataset.score, thing.dataset.commentsCount, thing.dataset.permalink));
}

function scanIn(node) {
  node.querySelectorAll(SHADOW_HOSTS).forEach(styleShadow);
}

function scan() {
  scanIn(document);
  document.querySelectorAll("shreddit-post").forEach(addMeta);
  document.querySelectorAll("#siteTable > .thing.link:not([data-rto-meta])").forEach(processOldReddit);
}

let queued = false;
const observer = new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; scan(); });
});
observer.observe(root, { childList: true, subtree: true });
