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
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    res.setHeader("X-Cache", "HIT");
    return res.json(cachedResponse);
  }

  // Intercept res.json
  const originalJson = res.json;
  res.json = (body) => {
    res.setHeader("X-Cache", "MISS");
    cache.set(key, body, ttl);
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

export { cacheMiddleware, clearCache };
export default cacheMiddleware;
