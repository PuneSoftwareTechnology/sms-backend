import bcrypt from "bcryptjs";
import crypto from "crypto";
import ApiError from "../utils/apiError.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";
import userRepository from "../repositories/user.repository.js";
import authTokenRepository from "../repositories/authToken.repository.js";
import emailService from "./email.service.js";

async function login(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.is_active) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ id: user.id, role: user.role });
  await userRepository.updateLastLogin(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.is_approved,
      isEmailVerified: user.is_email_verified,
    },
  };
}

async function verifyEmail(token) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await authTokenRepository.findValidEmailVerification(
      token,
      client,
    );
    if (!row) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    const user = await userRepository.setEmailVerified(row.user_id, client);
    await authTokenRepository.markEmailVerificationUsed(row.id, client);

    await client.query("COMMIT");
    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { sent: true };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await authTokenRepository.createPasswordReset(user.id, token, expiresAt);

  await emailService.sendPasswordResetEmail({ to: user.email, token, name: user.name });

  return { sent: true };
}

async function resetPassword(token, newPassword) {
  const row = await authTokenRepository.findValidPasswordReset(token);
  if (!row) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await userRepository.updatePasswordHash(row.user_id, passwordHash, client);
    await authTokenRepository.markPasswordResetUsed(row.id, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { reset: true };
}

async function logout(token) {
  try {
    const decoded = verifyToken(token);
    const expiresAt = new Date(decoded.exp * 1000);
    await authTokenRepository.blacklistToken(token, expiresAt);
  } catch (error) {
    // Invalid token treated as logged out.
  }

  return { loggedOut: true };
}

export { login, verifyEmail, forgotPassword, resetPassword, logout };

export default { login, verifyEmail, forgotPassword, resetPassword, logout };
