const { runWithRequestCache } = require("../utils/requestContext");

/**
 * Initializes an empty Map in AsyncLocalStorage for the lifetime of the request.
 * Enables getSetting() and similar helpers to dedupe identical reads per request.
 */
function requestQueryCacheMiddleware(req, res, next) {
  runWithRequestCache(() => next());
}

module.exports = requestQueryCacheMiddleware;
