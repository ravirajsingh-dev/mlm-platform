/**
 * Bounds list pagination params to protect small Atlas tiers from huge skips/limits.
 * Response shapes stay the same; only invalid or abusive values are normalized.
 */

function clampListPageSize(limit, defaultSize = 20, maxSize = 50) {
  const parsed = parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultSize;
  return Math.min(parsed, maxSize);
}

function clampPositivePage(page, fallback = 1) {
  const parsed = parseInt(page, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

module.exports = {
  clampListPageSize,
  clampPositivePage,
};
