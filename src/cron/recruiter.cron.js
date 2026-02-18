import cron from 'node-cron';
import userRepository from '../repositories/user.repository.js';
function registerRecruiterInactivityCron() {
  // Runs daily at 01:30 server time.
  cron.schedule('30 1 * * *', async () => {
    try {
      const deactivatedCount = await userRepository.deactivateInactiveRecruiters();
      // eslint-disable-next-line no-console
      console.log(`Recruiter deactivation cron ran. Deactivated: ${deactivatedCount}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Recruiter deactivation cron failed', error);
    }
  });
}

export {
registerRecruiterInactivityCron,
};

export default {
registerRecruiterInactivityCron,
};
