const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth");
const authorize = require("../middleware/role");

const patientController = require("../controllers/patientController");
const notificationController = require("../controllers/notificationController");
const identityController = require("../controllers/identityController");
const { identityRateLimit, verifyIdentityCsrf } = require("../middleware/identitySecurity");
const requireIdentityVerification = require("../middleware/requireIdentityVerification");

const upload = require("../middleware/upload");
const reportUpload =
    require("../middleware/reportUpload");

/* ============================
   Dashboard
============================ */

router.get("/identity", protect, authorize("patient"), identityController.identityPage);
router.post("/identity/aadhaar/start", protect, authorize("patient"), identityRateLimit, verifyIdentityCsrf, identityController.startIdentityVerification);
router.get("/identity/face-verification", protect, authorize("patient"), identityController.facePage);
router.post("/identity/face-verification", protect, authorize("patient"), identityRateLimit, verifyIdentityCsrf, identityController.verifyFace);



router.get(
    "/dashboard",
    protect,
    authorize("patient"),
    patientController.dashboard
);


/* ============================
   Profile
============================ */

router.get(
    "/profile",
    protect,
    authorize("patient"),
    patientController.profile
);

router.post(
    "/profile",
    protect,
    authorize("patient"),
    upload.single("profileImage"),
    patientController.updateProfile
);


/* ============================
   Appointment
============================ */

router.get(
    "/book",
    protect,
    authorize("patient"),
    patientController.bookAppointmentPage
);

router.post(
    "/book",
    protect,
    authorize("patient"),
    patientController.bookAppointment
);

router.get(
    "/appointments",
    protect,
    authorize("patient"),
    patientController.myAppointments
);

// MUST COME BEFORE /appointments/:id
router.get(
    "/appointments/available-slots",
    protect,
    authorize("patient"),
    patientController.getAvailableSlots
);

router.get(
    "/appointments/:id",
    protect,
    authorize("patient"),
    patientController.appointmentDetails
);

router.post(
    "/appointments/:id/cancel",
    protect,
    authorize("patient"),
    patientController.cancelAppointment
);


/* ============================
   Medical History
============================ */

router.get(
    "/history",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.medicalHistory
);


/* ============================
   Prescription
============================ */

router.get(
    "/prescriptions",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.prescriptions
);


/* ============================
   Reports
============================ */

router.get(
    "/reports",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.reports
);

router.post(
    "/report/upload",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.uploadReport
);

router.get(
    "/report/download/:id",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.downloadReport
);

router.post(
    "/report/delete/:id",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.deleteReport
);


/* ============================
   Payments
============================ */

router.get(
    "/payments",
    protect,
    authorize("patient"),
    patientController.payments
);


/* ============================
   Notifications
============================ */

router.get(
    "/notifications",
    protect,
    authorize("patient"),
    notificationController.list
);

router.get("/notifications/unread-count", protect, authorize("patient"), notificationController.unreadCount);
router.post("/notifications/:id/read", protect, authorize("patient"), notificationController.markRead);
router.post("/notifications/read-all", protect, authorize("patient"), notificationController.markAllRead);

router.post(
    "/notification/read/:id",
    protect,
    authorize("patient"),
    notificationController.markRead
);


/* ============================
   Settings
============================ */

router.get(
    "/settings",
    protect,
    authorize("patient"),
    patientController.settings
);

router.post(
    "/change-password",
    protect,
    authorize("patient"),
    patientController.changePassword
);

router.post(
    "/delete-account",
    protect,
    authorize("patient"),
    patientController.deleteAccount
);

router.get(
    "/reports",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.reports
);

router.post(
    "/reports/upload",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    reportUpload.single("file"),
    patientController.uploadReport
);

router.get(
    "/reports/:id/download",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.downloadReport
);

router.post(
    "/reports/:id/delete",
    protect,
    authorize("patient"),
    requireIdentityVerification,
    patientController.deleteReport
);




// ============================================================
// Payment Routes
// ============================================================

router.get(
    "/payments",
    protect,
    authorize("patient"),
    patientController.payments
);

router.post(
    "/payments/create-order",
    protect,
    authorize("patient"),
    patientController.createPaymentOrder
);

router.post(
    "/payments/verify",
    protect,
    authorize("patient"),
    patientController.verifyPayment
);

module.exports = router;
