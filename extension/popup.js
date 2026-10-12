const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { enabled: true, allowLinks: false, minimal: true };

api.storage.local.get(DEFAULTS).then((s) => {
  for (const key of Object.keys(DEFAULTS)) {
    const box = document.getElementById(key);
    box.checked = s[key];
    box.addEventListener("change", () => api.storage.local.set({ [key]: box.checked }));
  }
});
