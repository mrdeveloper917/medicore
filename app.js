const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const methodOverride = require("method-override");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const User = require("./models/User");

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

app.use(cors({ origin: process.env.CORS_ORIGIN || false, credentials: true }));


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

app.use(morgan(":method :url :status :response-time ms", { skip: (req) => req.path.startsWith("/identity") }));


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
            process.env.SESSION_SECRET || "doctor-care-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production" && !req.secure && req.get("x-forwarded-proto") !== "https") {
        return res.status(400).send("HTTPS is required.");
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

// Medical reports are private records. They must be served only through the
// authenticated, ownership-checked patient download routes.
app.use("/uploads/reports", (req, res) => res.status(404).send("Not found"));

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

app.use("/", authRoutes);

app.use("/auth", authRoutes);

app.use("/patient", patientRoutes);


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


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.render("home/index");
});

// ============================================================
// PUBLIC DOCTORS PAGE
// GET /doctors
// ============================================================

app.get("/doctors", async (req, res) => {

    try {

        const doctors = await Doctor.find({
            isActive: true
        })
        .select(`
            name
            specialization
            qualification
            experience
            hospital
            clinic
            languages
            bio
            profileImage
            isVerified
        `)
        .sort({
            isVerified: -1,
            name: 1
        })
        .lean();


        res.render("home/doctors", {
            title: "Our Doctors | MediCore",
            doctors
        });


    } catch (error) {

        console.error(
            "Public doctors page error:",
            error
        );


        res.render("home/doctors", {
            title: "Our Doctors | MediCore",
            doctors: []
        });

    }

});


app.get("/departments", (req, res) => {

    res.render("home/department", {
        title: "Medical Departments | MediCore"
    });

});

app.get("/contact", (req, res) => {

    res.render("home/contact", {
        title: "Contact Us | MediCore"
    });

});

app.post("/contact", (req, res) => {

    console.log("Contact Form Submission:");
    console.log(req.body);

    res.render("home/contact", {
        title: "Contact Us | MediCore",
        success: "Thank you! Your message has been received."
    });

});


app.get("/home", (req, res) => {
    res.render("home/index");
});


app.get("/home.ejs", (req, res) => {
    res.redirect("/home");
});



app.get(
    "/views/home/index.ejs",
    (req, res) => {
        res.redirect("/home");
    }
);


app.get("/services", (req, res) => {
    res.render("home/services", {
        title: "Services | MediCore"
    });
});

app.get("/about", (req, res) => {
    res.render("home/about", {
        title: "About Us | MediCore"
    });
});


// ==========================================
// 404
// ==========================================

app.use((req, res) => {

    res.status(404).send(
        "404 Page Not Found"
    );

});


// ==========================================
// EXPORT
// ==========================================

module.exports = app;
