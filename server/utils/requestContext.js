const { AsyncLocalStorage } = require("async_hooks");

/**
 * Per-HTTP-request store for deduplicating identical async reads (e.g. getSetting).
 * Propagates across async/await within the same Express request.
 */
const requestAsyncLocalStorage = new AsyncLocalStorage();

function runWithRequestCache(callback) {
  return requestAsyncLocalStorage.run(new Map(), callback);
}

function getRequestCacheMap() {
  return requestAsyncLocalStorage.getStore();
}

module.exports = {
  runWithRequestCache,
  getRequestCacheMap,
};
