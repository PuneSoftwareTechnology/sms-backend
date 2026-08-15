import ApiError from '../utils/apiError.js';
import enquiryRepository from '../repositories/enquiry.repository.js';
import emailService from '../services/email.service.js';

// PST was renamed to TECHVAA. The Techvaa website posts enquiries here with a
// hard-coded institute code, so accept the old value and map it forward — the
// two systems can then be deployed in either order without dropping leads.
const LEGACY_INSTITUTES = { PST: 'TECHVAA' };

function normaliseInstitute(payload) {
  const mapped = LEGACY_INSTITUTES[payload.institute];
  return mapped ? { ...payload, institute: mapped } : payload;
}

async function createEnquiry(payload) {
  const created = await enquiryRepository.createEnquiry(
    normaliseInstitute(payload),
  );
  if (created?.demo_status === 'DONE' && created.email) {
    emailService
      .sendDemoDoneEmail({ to: created.email, institute: created.institute })
      .catch((err) =>
        console.error(`[Email] Demo-done email failed for ${created.email}:`, err?.message),
      );
  }
  return created;
}

async function listEnquiries(filters) {
  return enquiryRepository.listEnquiries(filters);
}

async function updateEnquiry(id, payload) {
  const existing = await enquiryRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Enquiry not found');
  }
  const updated = await enquiryRepository.updateEnquiry(
    id,
    normaliseInstitute(payload),
  );
  if (!updated) {
    throw new ApiError(404, 'Enquiry not found');
  }

  const becameDone =
    existing.demo_status !== 'DONE' && updated.demo_status === 'DONE';
  if (becameDone && updated.email) {
    emailService
      .sendDemoDoneEmail({ to: updated.email, institute: updated.institute })
      .catch((err) =>
        console.error(`[Email] Demo-done email failed for ${updated.email}:`, err?.message),
      );
  }

  return updated;
}

async function deleteEnquiry(id) {
  const deleted = await enquiryRepository.deleteEnquiry(id);
  if (!deleted) {
    throw new ApiError(404, 'Enquiry not found');
  }
  return deleted;
}

async function sendBulkEmail({ enquiryIds, subject, body }) {
  const contacts = await enquiryRepository.findContactsByIds(enquiryIds);
  if (!contacts.length) {
    return { sent: 0, failed: 0, skipped: enquiryIds.length };
  }
  const results = await emailService.sendBulkCustomEmail({
    recipients: contacts.map((c) => ({
      email: c.email,
      name: c.name,
      institute: c.institute,
    })),
    subject,
    body,
  });
  return { ...results, skipped: enquiryIds.length - contacts.length };
}

export { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry, sendBulkEmail };

export default { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry, sendBulkEmail };
