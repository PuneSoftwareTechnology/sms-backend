import ApiError from '../utils/apiError.js';
import enquiryRepository from '../repositories/enquiry.repository.js';

async function createEnquiry(payload) {
  return enquiryRepository.createEnquiry(payload);
}

async function listEnquiries(filters) {
  return enquiryRepository.listEnquiries(filters);
}

async function updateEnquiry(id, payload) {
  const updated = await enquiryRepository.updateEnquiry(id, payload);
  if (!updated) {
    throw new ApiError(404, 'Enquiry not found');
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

export { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry };

export default { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry };
