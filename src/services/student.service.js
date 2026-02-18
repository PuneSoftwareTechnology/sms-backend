import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import ApiError from '../utils/apiError.js';
import userRepository from '../repositories/user.repository.js';
import studentRepository from '../repositories/student.repository.js';
import verificationRepository from '../repositories/verification.repository.js';
import emailService from '../emails/email.service.js';
async function signup(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const user = await userRepository.createUser(
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        isApproved: false,
      },
      client,
    );

    await studentRepository.createEmptyProfile(user.id, client);

    const verificationToken = crypto.randomBytes(24).toString('hex');
    await verificationRepository.createVerificationToken(user.id, verificationToken, client);

    await client.query('COMMIT');

    await emailService.sendSignupVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });

    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateProfile(userId, payload) {
  const profile = await studentRepository.updateProfile(userId, payload);
  if (!profile) {
    throw new ApiError(404, 'Student profile not found');
  }
  return profile;
}

async function getProfile(userId, currentUser) {
  if (currentUser.role === 'STUDENT' && currentUser.id !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  const profile = await studentRepository.findFullProfile(userId);
  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  return profile;
}

export {
signup,
  updateProfile,
  getProfile,
};

export default {
signup,
  updateProfile,
  getProfile,
};
