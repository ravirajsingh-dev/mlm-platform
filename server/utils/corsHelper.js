const { ALLOWED_ORIGINS } = require("../config/config");

/**
 * CORS (Cross-Origin Resource Sharing) Helper
 *
 * This middleware controls which origins (domains) are allowed to make requests
 * to your API. It's a security feature that prevents unauthorized websites from
 * accessing your API from the browser.
 *
 * How it works:
 * 1. Reads allowed origins from config (comma-separated list from .env)
 * 2. When a request comes in, checks if the "Origin" header matches an allowed origin
 * 3. If match found: allows the request (returns { origin: true })
 * 4. If no match: blocks the request (returns { origin: false })
 *
 * Special case: If ALLOWED_ORIGINS is "*", all origins are allowed (development mode)
 */

// Parse and normalize allowed origins
const parseAllowedOrigins = (originsString) => {
  // If "*" is set, allow all origins (useful for development)
  if (originsString === "*") {
    return "*";
  }

  // Split by comma, trim whitespace, and filter out empty strings
  return originsString
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

// Pre-process allowed origins for efficient lookup
const allowedOriginsConfig = parseAllowedOrigins(ALLOWED_ORIGINS);
const allowedOriginsSet =
  allowedOriginsConfig === "*" ? "*" : new Set(allowedOriginsConfig); // Use Set for O(1) lookup performance

/**
 * CORS options delegate function for express-cors middleware
 *
 * @param {Object} req - Express request object
 * @param {Function} callback - Callback function (error, corsOptions)
 */
const corsOptionsDelegate = (req, callback) => {
  const origin = req.header("Origin");

  // If no Origin header (e.g., same-origin requests, Postman, curl), allow it
  // This is common for non-browser requests
  if (!origin) {
    return callback(null, { origin: true });
  }

  // If "*" is configured, allow all origins
  if (allowedOriginsSet === "*") {
    return callback(null, { origin: true });
  }

  // Check if the request origin is in the allowed list
  const isAllowed = allowedOriginsSet.has(origin);

  // Return CORS options based on whether origin is allowed
  callback(null, {
    origin: isAllowed,
    // Additional CORS options can be added here:
    // credentials: isAllowed, // Allow cookies/auth headers
    // methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    // allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  });
};

module.exports = corsOptionsDelegate;
