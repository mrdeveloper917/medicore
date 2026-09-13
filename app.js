const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const methodOverride = require("method-override");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const User = require("./models/User");
const mongoose = require("mongoose");


const uploadError = require("./middleware/uploadError");

const app = express();

// Render terminates TLS at its reverse proxy and forwards the original HTTPS
// scheme in X-Forwarded-Proto. Trust exactly that proxy in production so
// express-session can issue the secure session cookie used by CSRF protection.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}


// ==========================================
// MIDDLEWARES
// ==========================================

// Live-verification clips are short and bounded in the browser; the default
// 100kb JSON limit is insufficient for their base64 transport.
app.use(express.json({ limit: "10mb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

app.use(cookieParser());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || false,
        credentials: true
    })
);


// ==========================================
// HELMET
// ==========================================

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);


// ==========================================
// LOGGER
// ==========================================

app.use(
    morgan(
        ":method :url :status :response-time ms",
        {
            skip: (req) =>
                req.path.startsWith("/identity")
        }
    )
);


// ==========================================
// METHOD OVERRIDE
// ==========================================

app.use(methodOverride("_method"));


// ==========================================
// SESSION
// ==========================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "doctor-care-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure:
                process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);


app.use((req, res, next) => {

    if (
        process.env.NODE_ENV === "production" &&
        !req.secure &&
        req.get("x-forwarded-proto") !== "https"
    ) {
        return res
            .status(400)
            .send("HTTPS is required.");
    }

    next();
});


// ==========================================
// VIEW ENGINE
// ==========================================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);


// ==========================================
// STATIC FILES
// ==========================================

// Medical reports are private records.
// They must be served only through authenticated,
// ownership-checked patient download routes.

app.use(
    "/uploads/reports",
    (req, res) =>
        res.status(404).send("Not found")
);


// Main public folder

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ==========================================
// UPLOADS
// ==========================================

// Example:
// /uploads/doctors/certificates/file.pdf
//
// maps to:
// public/uploads/doctors/certificates/file.pdf

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "public",
            "uploads"
        )
    )
);


// ==========================================
// UPLOAD ERROR HANDLER
// ==========================================

app.use(uploadError);


// ==========================================
// ROUTES
// ==========================================

const authRoutes =
    require("./routes/authRoutes");

const patientRoutes =
    require("./routes/patientRoutes");

const doctorRoutes =
    require("./routes/doctorRoutes");


// ==========================================
// AUTH ROUTES
// ==========================================

app.use(
    "/",
    authRoutes
);

app.use(
    "/auth",
    authRoutes
);


// ==========================================
// PATIENT ROUTES
// ==========================================

app.use(
    "/patient",
    patientRoutes
);


// ==========================================
// DOCTOR ROUTES
// ==========================================

app.use(
    "/doctor",
    doctorRoutes
);


// =====================================================
// GLOBAL FOOTER DOCTORS
// =====================================================
//
// This data is available to footer.ejs on every page.
//
// IMPORTANT:
// This does NOT require login.
//
// =====================================================

app.use(async (req, res, next) => {

    try {

        const footerDoctors =
            await User.find({
                role: "doctor"
            })
            .select(
                "firstName lastName name " +
                "specialization qualification " +
                "hospital clinic city state location " +
                "profileImage isVerified"
            )
            .sort({
                isVerified: -1,
                firstName: 1
            })
            .lean();


        res.locals.footerDoctors =
            footerDoctors;


    } catch (error) {

        console.error(
            "Footer doctors loading error:",
            error.message
        );


        // Footer failure should never
        // break the website.

        res.locals.footerDoctors = [];

    }


    next();

});

// ============================================================
// PUBLIC DOCTOR PROFILE
// GET /doctors/:id
// LOGIN / REGISTER NOT REQUIRED
// ============================================================

// ============================================================
// PUBLIC DOCTOR PROFILE
// ============================================================
// PUBLIC DOCTOR PROFILE
// GET /doctors/:id
// LOGIN NOT REQUIRED
// ============================================================

app.get("/doctors/:id", async (req, res) => {

    try {

        const { id } = req.params;

        console.log("====================================");
        console.log("Doctor Profile Request");
        console.log("Doctor ID:", id);
        console.log("====================================");


        // ---------------------------------------------
        // VALIDATE MONGODB ID
        // ---------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {

            console.log("Invalid Doctor ID:", id);

            return res.status(404).send(
                "Doctor not found"
            );
        }


        // ---------------------------------------------
        // FIND DOCTOR
        // ---------------------------------------------

        const doctor = await User.findOne({
            _id: id,
            role: "doctor"
        })
        .select(
            "firstName lastName " +
            "email phone gender " +
            "profileImage coverImage " +
            "address city state country pincode " +
            "qualification specialization registrationNumber " +
            "hospital clinic experience " +
            "consultationFee onlineConsultationFee " +
            "followUpDays bio languages " +
            "education experienceDetails certificates " +
            "socialLinks awards memberships availability " +
            "isVerified profileCompletion"
        )
        .lean();


        // ---------------------------------------------
        // DOCTOR NOT FOUND
        // ---------------------------------------------

        if (!doctor) {

            console.log(
                "Doctor not found in database:",
                id
            );

            return res.status(404).send(
                "Doctor not found"
            );
        }


        // ---------------------------------------------
        // DOCTOR FOUND
        // ---------------------------------------------

        console.log(
            "Doctor found:",
            doctor.firstName,
            doctor.lastName
        );


        // ---------------------------------------------
        // RENDER PROFILE
        // ---------------------------------------------

        return res.render(
            "home/doctor-profile",
            {
                title:
                    `Dr. ${doctor.firstName} ${doctor.lastName} | MediCore`,

                doctor
            }
        );

    } catch (error) {

        // ---------------------------------------------
        // ACTUAL ERROR IN TERMINAL
        // ---------------------------------------------

        console.error(
            "===================================="
        );

        console.error(
            "DOCTOR PROFILE ERROR"
        );

        console.error(
            error
        );

        console.error(
            "===================================="
        );


        return res.status(500).send(
            "Unable to load doctor profile"
        );
    }

});
// ==========================================
// HOME
// ==========================================

app.get(
    "/",
    (req, res) => {

        res.render(
            "home/index"
        );

    }
);


// ============================================================
// PUBLIC DOCTORS PAGE
// GET /doctors
// LOGIN / REGISTER NOT REQUIRED
// ============================================================
//
// Anyone can visit:
//
// http://localhost:5000/doctors
//
// No protect()
// No auth()
// No authorize()
// ============================================================

app.get(
    "/doctors",
    async (req, res) => {

        try {

            // -------------------------------------------------
            // Get all registered doctors
            // -------------------------------------------------

            const doctors =
                await User.find({
                    role: "doctor"
                })
                .select(
                    "firstName lastName name " +
                    "profileImage " +
                    "specialization " +
                    "qualification " +
                    "experience " +
                    "hospital " +
                    "clinic " +
                    "location " +
                    "city " +
                    "state " +
                    "bio " +
                    "languages " +
                    "consultationFee " +
                    "isVerified"
                )
                .sort({
                    isVerified: -1,
                    firstName: 1,
                    name: 1
                })
                .lean();


            console.log(
                `Public doctors loaded: ${doctors.length}`
            );


            // -------------------------------------------------
            // Render public doctors page
            // -------------------------------------------------

            return res.render(
                "home/doctors",
                {
                    title:
                        "Our Doctors | MediCore",

                    doctors:
                        doctors
                }
            );


        } catch (error) {

            console.error(
                "Public doctors page error:",
                error.message
            );


            // -------------------------------------------------
            // If database query fails,
            // don't crash the application.
            // -------------------------------------------------

            return res
                .status(500)
                .render(
                    "home/doctors",
                    {
                        title:
                            "Our Doctors | MediCore",

                        doctors: []
                    }
                );

        }

    }
);


// ==========================================
// DEPARTMENTS
// ==========================================

app.get(
    "/departments",
    (req, res) => {

        res.render(
            "home/department",
            {
                title:
                    "Medical Departments | MediCore"
            }
        );

    }
);


// ==========================================
// CONTACT
// ==========================================

app.get(
    "/contact",
    (req, res) => {

        res.render(
            "home/contact",
            {
                title:
                    "Contact Us | MediCore"
            }
        );

    }
);


// ==========================================
// CONTACT POST
// ==========================================

app.post(
    "/contact",
    (req, res) => {

        console.log(
            "Contact Form Submission:"
        );

        console.log(
            req.body
        );


        res.render(
            "home/contact",
            {
                title:
                    "Contact Us | MediCore",

                success:
                    "Thank you! Your message has been received."
            }
        );

    }
);


// ==========================================
// HOME ALIAS
// ==========================================

app.get(
    "/home",
    (req, res) => {

        res.render(
            "home/index"
        );

    }
);


// ==========================================
// HOME.EJS ALIAS
// ==========================================

app.get(
    "/home.ejs",
    (req, res) => {

        res.redirect(
            "/home"
        );

    }
);


// ==========================================
// OLD HOME PATH
// ==========================================

app.get(
    "/views/home/index.ejs",
    (req, res) => {

        res.redirect(
            "/home"
        );

    }
);


// ==========================================
// SERVICES
// ==========================================

app.get(
    "/services",
    (req, res) => {

        res.render(
            "home/services",
            {
                title:
                    "Services | MediCore"
            }
        );

    }
);


// ==========================================
// ABOUT
// ==========================================

app.get(
    "/about",
    (req, res) => {

        res.render(
            "home/about",
            {
                title:
                    "About Us | MediCore"
            }
        );

    }
);


// ==========================================
// 404
// ==========================================

app.use(
    (req, res) => {

        res
            .status(404)
            .send(
                "404 Page Not Found"
            );

    }
);


// ==========================================
// EXPORT
// ==========================================

module.exports = app;