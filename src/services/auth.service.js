import bcrypt from 'bcrypt';
import ApiError from '../utils/apiError.js';
import { signToken  } from '../utils/jwt.js';
import userRepository from '../repositories/user.repository.js';
async function login(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  await userRepository.updateLastLogin(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.is_approved,
    },
  };
}

export {
login,
};

export default {
login,
};
