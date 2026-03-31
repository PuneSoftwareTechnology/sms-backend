import userRepository from '../repositories/user.repository.js';

export async function deactivateInactiveRecruiters() {
  try {
    const deactivatedCount = await userRepository.deactivateInactiveRecruiters();
    console.log(`Recruiter deactivation ran. Deactivated: ${deactivatedCount}`);
    return { statusCode: 200, body: JSON.stringify({ deactivatedCount }) };
  } catch (error) {
    console.error('Recruiter deactivation failed', error);
    throw error;
  }
}
