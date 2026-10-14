const api = globalThis.browser ?? globalThis.chrome;

// Blockierregeln an die Schalter im Menü koppeln:
// rules.json          ↔ „Bilder & Videos gar nicht laden“ (blockMedia)
// rules-tracking.json ↔ „Reddit-Tracking blockieren“     (blockTracking)
const RULESETS = { blockMedia: "media", blockTracking: "tracking" };

async function syncRulesets() {
  const s = await api.storage.local.get({ blockMedia: true, blockTracking: true });
  const enableRulesetIds = [], disableRulesetIds = [];
  for (const [key, id] of Object.entries(RULESETS)) (s[key] ? enableRulesetIds : disableRulesetIds).push(id);
  await api.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds, disableRulesetIds });
}

api.runtime.onInstalled.addListener(syncRulesets);
api.runtime.onStartup.addListener(syncRulesets);
api.storage.onChanged.addListener((changes) => {
  if (Object.keys(changes).some((k) => k in RULESETS)) syncRulesets();
});
