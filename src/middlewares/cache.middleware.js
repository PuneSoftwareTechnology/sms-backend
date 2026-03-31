import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

/**
 * Factory for response caching middleware
 * @param {number} ttl - TTL in seconds
 */
const cacheMiddleware = (ttl) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Skip caching for authenticated routes — they return per-user data
  if (req.headers.authorization) {
    res.setHeader("Cache-Control", "private, no-cache");
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Cache-Control", `public, max-age=${ttl}`);
    return res.json(cachedResponse);
  }

  // Intercept res.json
  const originalJson = res.json;
  res.json = (body) => {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 400) {
      cache.set(key, body, ttl);
      res.setHeader("Cache-Control", `public, max-age=${ttl}`);
    }
    res.setHeader("X-Cache", "MISS");
    return originalJson.call(res, body);
  };

  next();
};

/**
 * Clear all cache or specific key
 * @param {string} [key] - Optional key to clear
 */
const clearCache = (key) => {
  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
};

/**
 * Clear all cache keys that start with the given prefix
 * @param {string} prefix - URL prefix to match (e.g. '/api/public/courses')
 */
const clearCacheByPrefix = (prefix) => {
  const keys = cache.keys();
  const matching = keys.filter((k) => k.startsWith(prefix));
  if (matching.length) {
    cache.del(matching);
  }
};

export { cacheMiddleware, clearCache, clearCacheByPrefix };
export default cacheMiddleware;
