import bcrypt from "bcrypt";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import paymentRepository from "../repositories/payment.repository.js";
import s3Service from "../utils/s3.service.js";

async function signup(payload) {
  // 1. Check if a user with this email was pre-enrolled by admin
  const existingUser = await userRepository.findByEmail(payload.email);

  if (!existingUser) {
    throw new ApiError(
      400,
      "You are not enrolled. Please contact admin to enroll first.",
    );
  }

  // 2. Verify this user has an enrollment record
  const enrollment = await enrollmentRepository.findByEmail(payload.email);
  if (!enrollment) {
    throw new ApiError(
      400,
      "No enrollment found for this email. Please contact admin.",
    );
  }

  // 3. Check enrollment is approved
  if (enrollment.enrollment_status !== "APPROVED") {
    throw new ApiError(
      403,
      "Your enrollment is not yet approved. Please contact admin for approval.",
    );
  }

  // 5. Activate: update password and mark email as verified (admin already validated identity)
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await userRepository.updatePasswordHash(
      existingUser.id,
      passwordHash,
      client,
    );
    await userRepository.setEmailVerified(existingUser.id, client);

    await client.query("COMMIT");

    return existingUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateProfile(userId, payload) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update name/phone in users table if provided
    if (payload.name || payload.phone) {
      const userFields = [];
      const userValues = [];
      if (payload.name) {
        userValues.push(payload.name);
        userFields.push(`name = $${userValues.length}`);
      }
      if (payload.phone) {
        userValues.push(payload.phone);
        userFields.push(`phone = $${userValues.length}`);
      }
      userValues.push(userId);
      await client.query(
        `UPDATE users SET ${userFields.join(", ")}, updated_at = NOW() WHERE id = $${userValues.length}`,
        userValues,
      );
    }

    // Update student_profiles table
    const profile = await studentRepository.updateProfile(
      userId,
      payload,
      client,
    );
    if (!profile) {
      throw new ApiError(404, "Student profile not found");
    }

    await client.query("COMMIT");

    // Return the full combined profile
    return studentRepository.findFullProfile(userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function uploadProfilePhoto(studentId, file) {
  if (!file) {
    throw new ApiError(400, "Profile photo is required");
  }

  const oldProfile = await studentRepository.findFullProfile(studentId);
  const oldPhotoUrl = oldProfile?.profilePhoto;

  const key = `profile-photos/${studentId}/${Date.now()}_${file.originalname}`;
  const photoUrl = await s3Service.uploadBuffer(
    file.buffer,
    key,
    file.mimetype,
  );

  const updated = await studentRepository.updatePhotoUrl(studentId, photoUrl);
  if (!updated) {
    throw new ApiError(404, "Student profile not found");
  }

  if (oldPhotoUrl) {
    await s3Service.deleteObjectByUrl(oldPhotoUrl);
  }

  return studentRepository.findFullProfile(studentId);
}

async function getProfile(userId, currentUser) {
  if (currentUser.role === "STUDENT" && currentUser.id !== userId) {
    throw new ApiError(403, "Forbidden");
  }

  const profile = await studentRepository.findFullProfile(userId);
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  return profile;
}

async function approveStudent(studentId) {
  const approved = await userRepository.approveStudent(studentId);
  if (!approved) {
    throw new ApiError(404, "Student not found");
  }
  return approved;
}

async function uploadProject(studentId, file) {
  if (!file) {
    throw new ApiError(400, "Project file is required");
  }

  const key = `projects/${studentId}/${Date.now()}_${file.originalname}`;
  const fileUrl = await s3Service.uploadBuffer(file.buffer, key, file.mimetype);
  return studentRepository.createProjectSubmission(studentId, fileUrl);
}

async function uploadCv(studentId, file) {
  if (!file) {
    throw new ApiError(400, "CV file is required");
  }

  const existingCv = await studentRepository.findCvByStudentId(studentId);

  const key = `cvs/${studentId}.pdf`;
  const fileUrl = await s3Service.uploadBuffer(file.buffer, key, file.mimetype);

  const cv = await studentRepository.upsertCv(studentId, fileUrl);

  if (existingCv && existingCv.file_url && existingCv.file_url !== fileUrl) {
    await s3Service.deleteObjectByUrl(existingCv.file_url);
  }

  return cv;
}

async function getMyFullProfile(studentId) {
  const profile = await studentRepository.findFullProfile(studentId);
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const enrollment = await enrollmentRepository.findByStudentId(studentId);

  // Fetch payment data, QR code, CV, and evaluations in parallel
  const [qrResult, payments, cv, evaluations] = await Promise.all([
    pool.query(
      "SELECT image_url, bank_name FROM qr_codes WHERE is_active = true LIMIT 1",
    ),
    enrollment
      ? paymentRepository.findByEnrollmentId(enrollment.id)
      : Promise.resolve([]),
    studentRepository.findCvByStudentId(studentId),
    studentRepository.findEvaluationsByStudentId(studentId),
  ]);

  const activeQr = qrResult.rows[0] || null;

  // Build payment summary
  let paymentSummary = null;
  if (enrollment) {
    const paymentsByInstallment = {};
    for (const p of payments) {
      paymentsByInstallment[p.installment_number] = p;
    }

    const getInstallment = (num) => {
      const pmtRow = paymentsByInstallment[num];
      const enrollAmt = enrollment[`installment${num}_amount`];
      const enrollDate = enrollment[`installment${num}_date`];
      const enrollMode = enrollment[`installment${num}_mode`];

      const amount = pmtRow
        ? Number(pmtRow.amount)
        : enrollAmt
          ? Number(enrollAmt)
          : undefined;
      const date = pmtRow ? pmtRow.payment_date : enrollDate || undefined;
      const mode = enrollMode || undefined;

      return { amount, date, mode };
    };

    const inst1 = getInstallment(1);
    const inst2 = getInstallment(2);
    const inst3 = getInstallment(3);

    const paid =
      (inst1.amount || 0) + (inst2.amount || 0) + (inst3.amount || 0);

    paymentSummary = {
      total_fee: Number(enrollment.total_fee || 0),
      paid_amount: paid,
      pending_amount: Number(enrollment.total_fee || 0) - paid,
      qr_code_url: activeQr?.image_url || "",
      qr_bank_name: activeQr?.bank_name || "",
      installment1_amount: inst1.amount,
      installment1_date: inst1.date,
      installment1_mode: inst1.mode,
      installment2_amount: inst2.amount,
      installment2_date: inst2.date,
      installment2_mode: inst2.mode,
      installment3_amount: inst3.amount,
      installment3_date: inst3.date,
      installment3_mode: inst3.mode,
    };
  }

  return {
    ...profile,
    payments: paymentSummary,
    evaluations,
    cvTemplates: [],
    cv: cv ? { url: cv.file_url } : null,
  };
}

async function updateCommunicationScore(evaluationId, communicationScore) {
  if (communicationScore < 0 || communicationScore > 10) {
    throw new ApiError(400, "Communication score must be between 0 and 10");
  }

  const updated = await studentRepository.updateCommunicationScore(evaluationId, communicationScore);
  if (!updated) {
    throw new ApiError(404, "Evaluation not found");
  }
  return updated;
}

async function uploadCertificate(studentId, file) {
  if (!file) {
    throw new ApiError(400, "Certificate file is required");
  }

  const key = `certificates/${studentId}/${Date.now()}_${file.originalname}`;
  const fileUrl = await s3Service.uploadBuffer(file.buffer, key, file.mimetype);
  return { url: fileUrl };
}

export {
  signup,
  updateProfile,
  uploadProfilePhoto,
  getProfile,
  getMyFullProfile,
  approveStudent,
  uploadProject,
  uploadCv,
  uploadCertificate,
  updateCommunicationScore,
};

export default {
  signup,
  updateProfile,
  uploadProfilePhoto,
  getProfile,
  getMyFullProfile,
  approveStudent,
  uploadProject,
  uploadCv,
  uploadCertificate,
  updateCommunicationScore,
};
