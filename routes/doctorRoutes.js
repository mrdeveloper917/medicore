const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLERS & MIDDLEWARE
// ============================================================

const doctorController = require("../controllers/doctorController");
const notificationController = require("../controllers/notificationController");

const auth = require("../middleware/auth");
const protect = require("../middleware/auth");

const upload = require("../middleware/uploadDoctor");

const reportUpload = require("../middleware/reportUpload");

const {
  educationValidation,
} = require("../middleware/validation/educationValidation");

const {
  experienceValidation,
} = require("../middleware/validation/experienceValidation");

const authorize = require("../middleware/role");


// ============================================================
// DEBUG LOGS
// ============================================================

console.log("auth:", typeof auth);
console.log(
  "educationValidation:",
  typeof educationValidation
);
console.log(
  "experienceValidation:",
  typeof experienceValidation
);
console.log(
  "doctorController:",
  Object.keys(doctorController)
);

// ============================================================
// DOCTOR PROFILE ROUTES
// ============================================================


// ------------------------------------------------------------
// Doctor Profile
// GET /doctor/profile
// ------------------------------------------------------------

router.get(
    "/profile",
    protect,
    authorize("doctor"),
    doctorController.getProfile
);


// ------------------------------------------------------------
// Edit Doctor Profile Page
// GET /doctor/profile/edit
// ------------------------------------------------------------

router.get(
    "/profile/edit",
    protect,
    authorize("doctor"),
    doctorController.getEditProfile
);


// ------------------------------------------------------------
// Update Doctor Profile
// POST /doctor/profile/edit
// ------------------------------------------------------------

router.post(
    "/profile/edit",
    protect,
    authorize("doctor"),
    doctorController.updateProfile
);


// ============================================================
// PROFILE ROUTES
// ============================================================

// Update Doctor Profile
router.post(
  "/profile/update",
  auth,
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  doctorController.updateProfile
);


// ============================================================
// CERTIFICATE ROUTES
// ============================================================

// View Certificates
router.get(
  "/certificates",
  auth,
  doctorController.getCertificates
);

// Add Certificate Page
router.get(
  "/certificates/add",
  auth,
  doctorController.getAddCertificate
);

// Upload Certificate
router.post(
  "/certificates",
  auth,
  upload.single("certificate"),
  doctorController.uploadCertificate
);

// Delete Certificate
router.post(
  "/certificates/delete/:id",
  auth,
  doctorController.deleteCertificate
);


// ============================================================
// EDUCATION ROUTES
// ============================================================

// Add Education Page
router.get(
  "/education/add",
  auth,
  doctorController.getAddEducation
);

// Add Education
router.post(
  "/education/add",
  auth,
  educationValidation,
  doctorController.addEducation
);

// View Education
router.get(
  "/education",
  auth,
  doctorController.getEducation
);

// Update Education
router.post(
  "/education/update/:id",
  auth,
  educationValidation,
  doctorController.updateEducation
);

// Delete Education
router.post(
  "/education/delete/:id",
  auth,
  doctorController.deleteEducation
);


// ============================================================
// EXPERIENCE ROUTES
// ============================================================

// Add Experience Page
router.get(
  "/experience/add",
  auth,
  doctorController.getAddExperience
);

// Add Experience
router.post(
  "/experience/add",
  auth,
  doctorController.addExperience
);

// View Experience
router.get(
  "/experience",
  auth,
  doctorController.getExperience
);

// Edit Experience Page
router.get(
  "/experience/edit/:id",
  auth,
  doctorController.getEditExperience
);

// Update Experience
router.post(
  "/experience/update/:id",
  auth,
  doctorController.updateExperience
);

// Delete Experience
router.post(
  "/experience/delete/:id",
  auth,
  doctorController.deleteExperience
);


// ============================================================
// AWARD ROUTES
// ============================================================

// Add Award Page
router.get(
  "/awards/add",
  auth,
  doctorController.getAddAward
);

// Save Award
router.post(
  "/awards/add",
  auth,
  upload.single("certificate"),
  doctorController.addAward
);

// View Awards
router.get(
  "/awards",
  auth,
  doctorController.getAwards
);

// Edit Award Page
router.get(
  "/awards/edit/:id",
  auth,
  doctorController.getEditAward
);

// Delete Award
router.post(
  "/awards/delete/:id",
  auth,
  doctorController.deleteAward
);


// ============================================================
// DOCTOR APPOINTMENT ROUTES
// ============================================================

// ------------------------------------------------------------
// Appointment List
// GET /doctor/appointments
// ------------------------------------------------------------

router.get(
  "/appointments",
  protect,
  authorize("doctor"),
  doctorController.getAppointments
);

router.get("/notifications", protect, authorize("doctor"), notificationController.list);
router.get("/notifications/unread-count", protect, authorize("doctor"), notificationController.unreadCount);
router.post("/notifications/:id/read", protect, authorize("doctor"), notificationController.markRead);
router.post("/notifications/read-all", protect, authorize("doctor"), notificationController.markAllRead);


// ------------------------------------------------------------
// Appointment Details
// GET /doctor/appointments/:id
// ------------------------------------------------------------

router.get(
  "/appointments/:id",
  protect,
  authorize("doctor"),
  doctorController.getAppointmentDetails
);


// ------------------------------------------------------------
// Approve Appointment
// POST /doctor/appointments/:id/approve
// ------------------------------------------------------------

router.post(
  "/appointments/:id/approve",
  protect,
  authorize("doctor"),
  doctorController.approveAppointment
);

router.post("/appointments/:id/reject", protect, authorize("doctor"), doctorController.rejectAppointment);


// ------------------------------------------------------------
// Cancel Appointment
// POST /doctor/appointments/:id/cancel
// ------------------------------------------------------------

router.post(
  "/appointments/:id/cancel",
  protect,
  authorize("doctor"),
  doctorController.cancelAppointment
);


// ------------------------------------------------------------
// Complete Appointment
// POST /doctor/appointments/:id/complete
// ------------------------------------------------------------

router.post(
  "/appointments/:id/complete",
  protect,
  authorize("doctor"),
  doctorController.completeAppointment
);


// ============================================================
// MEDICAL RECORD ROUTES
// ============================================================

// ------------------------------------------------------------
// Add Medical Record Page
// GET /doctor/appointments/:id/medical-record
// ------------------------------------------------------------

router.get(
  "/appointments/:id/medical-record",
  protect,
  authorize("doctor"),
  doctorController.getAddMedicalRecord
);


// ------------------------------------------------------------
// Save Medical Record
// POST /doctor/appointments/:id/medical-record
// ------------------------------------------------------------

router.post(
  "/appointments/:id/medical-record",
  protect,
  authorize("doctor"),
  doctorController.addMedicalRecord
);

router.get(
    "/appointments/:id/medical-record/view",
    protect,
    authorize("doctor"),
    doctorController.getMedicalRecord
);


// ============================================================
// DOCTOR → PATIENT ROUTES
// ============================================================

// Patient List
router.get(
    "/patients",
    protect,
    authorize("doctor"),
    doctorController.getPatients
);


// Patient Details
router.get(
    "/patients/:id",
    protect,
    authorize("doctor"),
    doctorController.getPatientDetails
);


// Patient Appointments
router.get(
    "/patients/:id/appointments",
    protect,
    authorize("doctor"),
    doctorController.getPatientAppointments
);


// Patient Medical History
router.get(
    "/patients/:id/medical-history",
    protect,
    authorize("doctor"),
    doctorController.getPatientMedicalHistory
);

// ============================================================
// DOCTOR - PRESCRIPTIONS
// ============================================================

router.get(
    "/prescriptions",
    protect,
    authorize("doctor"),
    doctorController.getPrescriptions
);

router.get(
    "/prescriptions/create",
    protect,
    authorize("doctor"),
    doctorController.getCreatePrescription
);

router.post(
    "/prescriptions/create",
    protect,
    authorize("doctor"),
    doctorController.createPrescription
);

router.get(
    "/prescriptions/:id",
    protect,
    authorize("doctor"),
    doctorController.getPrescriptionDetails
);

router.post(
    "/prescriptions/:id/delete",
    protect,
    authorize("doctor"),
    doctorController.deletePrescription
);


// ============================================================
// DOCTOR - REPORTS
// ============================================================

router.get(
    "/reports",
    protect,
    authorize("doctor"),
    doctorController.getReports
);

router.get(
    "/reports/create",
    protect,
    authorize("doctor"),
    doctorController.getCreateReport
);

router.post(
    "/reports/create",
    protect,
    authorize("doctor"),
    reportUpload.single("file"),
    doctorController.createReport
);

router.get(
    "/reports/:id",
    protect,
    authorize("doctor"),
    doctorController.getReportDetails
);

router.post(
    "/reports/:id/delete",
    protect,
    authorize("doctor"),
    doctorController.deleteReport
);

// ============================================================
// DOCTOR - AVAILABILITY
// ============================================================

// ------------------------------------------------------------
// Availability Page
// GET /doctor/availability
// ------------------------------------------------------------
router.get(
    "/availability",
    protect,
    authorize("doctor"),
    doctorController.getAvailability
);


// ------------------------------------------------------------
// Save Availability
// POST /doctor/availability
// ------------------------------------------------------------
router.post(
    "/availability",
    protect,
    authorize("doctor"),
    doctorController.saveAvailability
);

// ============================================================
// EARNINGS
// ============================================================

router.get(
    "/earnings",
    protect,
    authorize("doctor"),
    doctorController.getEarnings
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
