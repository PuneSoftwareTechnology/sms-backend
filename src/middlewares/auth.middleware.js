import ApiError from "../utils/apiError.js";
import { verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";

/**
 * Single-query auth: verifies user is active AND token is not blacklisted
 * in one DB round-trip instead of two (~50-100ms saved per request on Lambda).
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Unauthorized"));
  }

  try {
    const decoded = verifyToken(token);

    const { rows } = await pool.query(
      `SELECT u.id, u.role, u.is_active,
              EXISTS(SELECT 1 FROM token_blacklist WHERE token = $2 AND expires_at > NOW()) AS blacklisted
       FROM users u
       WHERE u.id = $1`,
      [decoded.id, token],
    );

    const user = rows[0];

    if (!user) {
      return next(new ApiError(401, "Account not found"));
    }

    if (user.blacklisted) {
      return next(new ApiError(401, "Token is invalidated"));
    }

    if (!user.is_active) {
      return next(new ApiError(401, "Account is inactive"));
    }

    req.user = { id: user.id, role: user.role };
    req.token = token;
    return next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export default authMiddleware;
