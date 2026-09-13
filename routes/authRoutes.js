const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const authController = require("../controllers/authController");
const identityController = require("../controllers/identityController");
const { identityRateLimit, verifyRegistrationCsrf } = require("../middleware/identitySecurity");
const doctorController = require("../controllers/doctorController");

const protect = require("../middleware/auth");

const authorize = require("../middleware/role");

const {
    registerValidation
} = require("../validators/authValidator");

/* ==========================
   Multer Configuration
========================== */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/patients/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/* ==========================
   Public Routes
========================== */

// Register Page
router.get("/register", identityController.registrationPage);

// Login Page
router.get("/login", (req, res) => {

    res.render("auth/login", {
        title: "Login",
        message: null,
        success: null
    });

});

// Forgot Password Page
router.get("/forgot-password", (req, res) => {

    res.render("auth/forgot-password", {
        title: "Forgot Password",
        message: null,
        success: null
    });

});

// Reset Password Page
router.get("/reset-password/:token", (req, res) => {

    res.render("auth/reset-password", {
        title: "Reset Password",
        token: req.params.token,
        message: null,
        success: null
    });

});

/* ==========================
   Authentication
========================== */

// Register User
router.post(
    "/register",
    upload.single('profileImage'),
    identityRateLimit,
    verifyRegistrationCsrf,
    registerValidation,
    identityController.startRegistration
);

router.all("/identity/aadhaar/callback", identityController.completeRegistration);

// Login User
router.post(
    "/login",
    authController.login
);

// Logout
router.get(
    "/logout",
    authController.logout
);

// Forgot Password
router.post(
    "/forgot-password",
    authController.forgotPassword
);

// Reset Password
router.post(
    "/reset-password/:token",
    authController.resetPassword
);

/* ======================================
   Profile
====================================== */

// View Profile
router.get(
    "/profile",
    protect,
    authController.profile
);

// Update Profile
router.post(
    "/profile/update",
    protect,
    authController.updateProfile
);

/* ======================================
   Admin
====================================== */

router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {

        res.send("Admin Dashboard");

    }
);

/* ======================================
   Doctor
====================================== */

router.get(
    "/doctor",
    protect,
    authorize("doctor"),
    (req, res) => {

        res.redirect("/doctor/dashboard");

    }
);

router.get(
    "/doctor/dashboard",
    protect,
    authorize("doctor"),
    doctorController.dashboard
);

router.get(
    "/doctor/profile",
    protect,
    authorize("doctor"),
    doctorController.profile
);

/* ======================================
   Receptionist
====================================== */

router.get(
    "/receptionist",
    protect,
    authorize("receptionist"),
    (req, res) => {

        res.send("Receptionist Dashboard");

    }
);

/* ======================================
   Nurse
====================================== */

router.get(
    "/nurse",
    protect,
    authorize("nurse"),
    (req, res) => {

        res.send("Nurse Dashboard");

    }
);

// Show logout confirmation page
router.get("/logout", protect, (req, res) => {
    res.render("auth/logout", {
        role: req.user?.role || "patient"
    });
});


// Perform actual logout
router.post("/logout", (req, res) => {

    req.logout(function (err) {

        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).send("Unable to logout");
        }

        req.session.destroy((sessionErr) => {

            if (sessionErr) {
                console.error("Session Destroy Error:", sessionErr);
            }

            res.redirect("/login");
        });

    });

});
module.exports = router;
