import enquiryService from "../services/enquiry.service.js";
import { ok } from "../utils/apiResponse.js";

async function createEnquiry(req, res) {
  const row = await enquiryService.createEnquiry(req.validated.body);
  return ok(res, row, "Enquiry created", 201);
}

async function listEnquiries(req, res) {
  const result = await enquiryService.listEnquiries({
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    leadStatus: req.query.leadStatus,
    demoStatus: req.query.demoStatus,
    institute: req.query.institute,
    course: req.query.course,
    enquiryType: req.query.enquiryType,
    page: req.query.page,
    limit: req.query.limit,
  });
  return ok(res, result, "Enquiries fetched");
}

async function updateEnquiry(req, res) {
  const row = await enquiryService.updateEnquiry(
    req.params.id,
    req.validated.body,
  );
  return ok(res, row, "Enquiry updated");
}

async function deleteEnquiry(req, res) {
  const row = await enquiryService.deleteEnquiry(req.params.id);
  return ok(res, row, "Enquiry deleted");
}

async function sendBulkEmail(req, res) {
  const { enquiryIds, subject, body } = req.validated.body;
  const results = await enquiryService.sendBulkEmail({ enquiryIds, subject, body });
  return ok(res, results, `${results.sent} email(s) sent successfully`);
}

export { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry, sendBulkEmail };

export default { createEnquiry, listEnquiries, updateEnquiry, deleteEnquiry, sendBulkEmail };
