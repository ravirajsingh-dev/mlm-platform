/**
 * Short-lived in-memory cache for the public common-settings payload only.
 * Invalidated on admin settings update to avoid stale marquee/footer for long.
 */

const TTL_MS =
  Number(process.env.PUBLIC_COMMON_SETTINGS_CACHE_TTL_MS) || 45000;

let entry = { payload: null, expiresAt: 0 };

const getCachedPayload = () => {
  if (entry.payload && entry.expiresAt > Date.now()) {
    return entry.payload;
  }
  return null;
};

const setCachedPayload = (payload) => {
  entry = { payload, expiresAt: Date.now() + TTL_MS };
};

const clearPublicSettingsCache = () => {
  entry = { payload: null, expiresAt: 0 };
};

module.exports = {
  getCachedPayload,
  setCachedPayload,
  clearPublicSettingsCache,
};
