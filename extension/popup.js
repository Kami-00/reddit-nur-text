const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { enabled: true, allowLinks: false, minimal: true, blockMedia: true, blockTracking: true };

api.storage.local.get(DEFAULTS).then((s) => {
  for (const key of Object.keys(DEFAULTS)) {
    const box = document.getElementById(key);
    box.checked = s[key];
    box.addEventListener("change", () => api.storage.local.set({ [key]: box.checked }));
  }
});

// Hinweis, falls Firefox den Zugriff auf reddit.com zurückhält (dann wirkt das
// Add-on nur nach einem Klick auf das Symbol und nicht auf neu geöffneten Seiten)
const REDDIT = { origins: ["*://*.reddit.com/*"] };
const access = document.getElementById("access");

api.permissions.contains(REDDIT).then((ok) => {
  access.style.display = ok ? "none" : "block";
});
document.getElementById("grant").addEventListener("click", () => {
  api.permissions.request(REDDIT).then((ok) => {
    if (ok) access.style.display = "none";
  });
});
