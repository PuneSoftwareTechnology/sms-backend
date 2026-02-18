import env from './config/env.js';
import app from './app.js';
import { registerRecruiterInactivityCron  } from './cron/recruiter.cron.js';
app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

registerRecruiterInactivityCron();
