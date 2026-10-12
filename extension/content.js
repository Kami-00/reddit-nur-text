const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { enabled: true, allowLinks: false, minimal: true };
const root = document.documentElement;

// Styles für das Innere (Shadow DOM) der Reddit-Posts – dort greift normales CSS nicht
const SHADOW_CSS = `
  [data-post-click-location="vote"],
  button[upvote], button[downvote],
  [name="comments-action-button"],
  shreddit-post-share-button, award-button,
  slot[name="share-button"], slot[name="comment-button"], slot[name="award-button"],
  faceplate-number { display: none !important; }
`;
const shadowStyles = new Set();

function apply(s) {
  root.dataset.rto = !s.enabled ? "off" : s.allowLinks ? "links" : "strict";
  const minimal = s.enabled && s.minimal;
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

function processNewReddit(post) {
  const sr = post.openOrClosedShadowRoot ?? post.shadowRoot;
  if (sr && !sr.querySelector("style[data-rto]")) {
    const st = document.createElement("style");
    st.dataset.rto = "";
    st.textContent = SHADOW_CSS;
    st.media = root.hasAttribute("data-rto-min") ? "all" : "not all";
    sr.append(st);
    shadowStyles.add(st);
  }
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

function scan() {
  document.querySelectorAll("shreddit-post").forEach(processNewReddit);
  document.querySelectorAll("#siteTable > .thing.link:not([data-rto-meta])").forEach(processOldReddit);
}

let queued = false;
new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; scan(); });
}).observe(root, { childList: true, subtree: true });
