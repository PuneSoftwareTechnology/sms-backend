import ApiError from "../utils/apiError.js";

/**
 * INTERN is a restricted admin account. It reaches the /api/admin router like
 * ADMIN does, but only the endpoints backing the screens it is allowed to see:
 * Enquiry, QR Code, Access Management, and the Enquiry Figures / Recruiter
 * Shortlist / Placement / Candidate reports.
 *
 * The frontend hides the other menu items (see constants/access.ts); this
 * allow-list is what actually enforces it. Every other /api/admin endpoint —
 * enrollments, payments, tests, students, evaluations, CV templates, the
 * dashboard, fee dues and enrollment figures — stays admin-only.
 *
 * Paths are relative to the /api/admin mount point.
 */
const INTERN_ALLOWED_ROUTES = [
  // Enquiry
  { methods: ["GET", "POST"], path: /^\/enquiries$/ },
  { methods: ["POST"], path: /^\/enquiries\/send-email$/ },
  { methods: ["PUT", "DELETE"], path: /^\/enquiries\/[^/]+$/ },
  // Course dropdowns on the enquiry form
  { methods: ["GET"], path: /^\/courses$/ },
  // QR Code
  { methods: ["GET"], path: /^\/qr-codes$/ },
  // Access Management (recruiter accounts)
  { methods: ["GET", "POST"], path: /^\/recruiters$/ },
  { methods: ["PUT", "DELETE"], path: /^\/recruiters\/[^/]+$/ },
  // Reports
  { methods: ["GET"], path: /^\/recruiter-shortlist$/ },
  { methods: ["GET"], path: /^\/reports\/enquiry-figures$/ },
  { methods: ["GET"], path: /^\/reports\/candidates$/ },
  { methods: ["GET"], path: /^\/reports\/candidates\/[^/]+\/cv$/ },
  {
    methods: ["POST"],
    path: /^\/reports\/candidates\/(download-cvs|send-email|add-comment)$/,
  },
  { methods: ["PUT"], path: /^\/reports\/candidates\/[^/]+\/remark$/ },
  { methods: ["GET"], path: /^\/reports\/placement$/ },
  { methods: ["PUT"], path: /^\/reports\/placement\/[^/]+(\/revert)?$/ },
];

function isInternAllowed(method, path) {
  return INTERN_ALLOWED_ROUTES.some(
    (route) => route.methods.includes(method) && route.path.test(path),
  );
}

function restrictIntern(req, res, next) {
  if (req.user?.role !== "INTERN") return next();
  if (isInternAllowed(req.method, req.path)) return next();
  return next(new ApiError(403, "Forbidden"));
}

export { INTERN_ALLOWED_ROUTES, isInternAllowed };
export default restrictIntern;
