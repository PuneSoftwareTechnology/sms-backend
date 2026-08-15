CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  -- INTERN is a restricted admin account: enquiries, QR code, access management
  -- and four of the report screens. See middlewares/internAccess.middleware.js.
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RECRUITER', 'STUDENT', 'INTERN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Existing databases predate INTERN, so add the label separately.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'INTERN';

DO $$ BEGIN
  CREATE TYPE employment_status_enum AS ENUM ('EMPLOYED', 'UNEMPLOYED', 'FREELANCER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- NEW is the state every enquiry starts in; staff move it on after contact.
  CREATE TYPE lead_status_enum AS ENUM ('NEW', 'PROSPECTIVE', 'NON_PROSPECTIVE', 'ENROLLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE demo_status_enum AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  city VARCHAR(100),
  area VARCHAR(100),
  photo_url TEXT,
  graduation VARCHAR(150),
  graduation_year INT,
  post_graduation VARCHAR(150),
  pg_year INT,
  employment_status employment_status_enum,
  last_work_year INT,
  it_exp_years INT DEFAULT 0,
  it_exp_months INT DEFAULT 0,
  non_it_exp_years INT DEFAULT 0,
  non_it_exp_months INT DEFAULT 0,
  certifications JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  course VARCHAR(100),
  institute VARCHAR(50),
  enquiry_type VARCHAR(20) DEFAULT 'WALKIN',
  lead_status lead_status_enum,
  demo_status demo_status_enum,
  demo_date DATE,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS demo_date DATE;

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  enquiry_id UUID REFERENCES enquiries(id),
  institute VARCHAR(50),
  course TEXT NOT NULL,
  batch TEXT,
  trainer TEXT,
  start_date DATE,
  end_date DATE,
  enrollment_status TEXT NOT NULL DEFAULT 'NEW',
  completion_status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  total_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  placement_status TEXT DEFAULT 'NOT_PLACED',
  company_name TEXT,
  certificate_url TEXT,
  installment1_amount NUMERIC(10,2),
  installment1_date DATE,
  installment1_mode TEXT,
  installment2_amount NUMERIC(10,2),
  installment2_date DATE,
  installment2_mode TEXT,
  installment3_amount NUMERIC(10,2),
  installment3_date DATE,
  installment3_mode TEXT,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  installment_number INT NOT NULL,
  receipt_url TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  bank_name TEXT,
  branch TEXT,
  upi_id TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  total_marks INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS total_marks INT NOT NULL DEFAULT 0;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  correct_option TEXT NOT NULL,
  marks INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id),
  student_id UUID NOT NULL REFERENCES users(id),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_test_attempt_once UNIQUE (test_id, student_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  expiry_time TIMESTAMP NOT NULL,
  score INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  reset_at TIMESTAMP,
  reset_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Only one active (non-reset) attempt per user+test; reset rows kept for audit history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_attempt_active
  ON attempts (user_id, test_id) WHERE reset_at IS NULL;

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_answer_per_question UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure unique constraint exists even if table was created before UNIQUE was added
CREATE UNIQUE INDEX IF NOT EXISTS idx_cvs_student_id ON cvs(student_id);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  designation TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruiter_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recruiter_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  course TEXT NOT NULL,
  shortlisted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recruiter_id, student_id, course)
);

ALTER TABLE recruiter_shortlists ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  ALTER TABLE recruiter_shortlists
    ADD CONSTRAINT recruiter_shortlists_recruiter_student_course_key
    UNIQUE (recruiter_id, student_id, course);
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN duplicate_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch ON enrollments(batch);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_download_logs_recruiter ON recruiter_download_logs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers(attempt_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_enquiries_updated_at ON enquiries;
CREATE TRIGGER trg_enquiries_updated_at BEFORE UPDATE ON enquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON enrollments;
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cvs_updated_at ON cvs;
CREATE TRIGGER trg_cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_recruiter_profiles_updated_at ON recruiter_profiles;
CREATE TRIGGER trg_recruiter_profiles_updated_at BEFORE UPDATE ON recruiter_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS contacted_date DATE;
ALTER TABLE recruiter_download_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  technical_score NUMERIC(4,1) DEFAULT 0,
  communication_score NUMERIC(4,1) DEFAULT 0,
  scope_for_improvement TEXT,
  trainer_remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_enrollment ON evaluations(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_student ON candidate_comments(student_id);

DROP TRIGGER IF EXISTS trg_evaluations_updated_at ON evaluations;
CREATE TRIGGER trg_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enrollments_student_deleted ON enrollments(student_id, deleted);
CREATE INDEX IF NOT EXISTS idx_enrollments_deleted_completion ON enrollments(deleted, completion_status);
CREATE INDEX IF NOT EXISTS idx_tests_published_course ON tests(is_published, course) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_placement_not_contacted ON enrollments(end_date, deleted) WHERE deleted = FALSE AND contacted_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_placement_contacted ON enrollments(contacted_date DESC, deleted) WHERE deleted = FALSE AND contacted_date IS NOT NULL;

-- ─── CV / Resume Templates ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('FRESHER', 'EXPERIENCED')),
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cv_templates_course ON cv_templates(course);

DROP TRIGGER IF EXISTS trg_cv_templates_updated_at ON cv_templates;
CREATE TRIGGER trg_cv_templates_updated_at BEFORE UPDATE ON cv_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Master Courses (managed by Super Admin) ───────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Enquiry and enrollment keep independent course lists; names may differ.
  course_type VARCHAR(20) NOT NULL DEFAULT 'ENQUIRY',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_courses_name_type UNIQUE (name, course_type)
);

CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
