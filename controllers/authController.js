const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

const sendEmail = require("../utils/sendEmail");

/* ===========================
   Generate JWT Token
=========================== */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ===========================
   Register User
=========================== */

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("auth/register", {
        errors: errors.array(),
        message: null,
      });
    }

    const { firstName, lastName, email, phone, password, gender, role } =
      req.body;

    // Check Email

    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.render("auth/register", {
        message: "Email already exists.",
        errors: [],
      });
    }

    // Check Phone

    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.render("auth/register", {
        message: "Phone already exists.",
        errors: [],
      });
    }

    // Save User

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      gender,
      role: role || "patient",
      profileImage: req.file ? `/images/patients/${req.file.filename}` : undefined,
    });

    await user.save();

    res.redirect("/login");
  } catch (err) {
    console.log(err);

    res.status(500).send("Internal Server Error");
  }
};

/* ===========================
   Login User
=========================== */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/login", {
        message: "Invalid Email",
        success: null,
      });
    }

    if (user.isBlocked) {
      return res.render("auth/login", {
        message: "Account Blocked",
        success: null,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.render("auth/login", {
        message: "Incorrect Password",
        success: null,
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.lastLogin = new Date();

    await user.save();

    if (user.role === "patient") {
      req.session.identitySessionVerified = false;
      req.session.identityAadhaarVerified = false;
      req.session.identitySessionUserId = String(user._id);
    }

    // Redirect According to Role

    switch (user.role) {
      case "admin":
        return res.redirect("/admin/dashboard");

      case "doctor":
        return res.redirect("/doctor/dashboard");

      case "patient":
        return res.redirect("/patient/dashboard");

      case "receptionist":
        return res.redirect("/receptionist/dashboard");

      case "nurse":
        return res.redirect("/nurse/dashboard");

      default:
        return res.redirect("/");
    }
  } catch (err) {
    console.log(err);

    res.status(500).send("Internal Server Error");
  }
};

/* ===========================
   Logout
=========================== */

exports.logout = (req, res) => {
  req.session?.destroy(() => {
    const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" };
    res.clearCookie("token", options);
    res.clearCookie("connect.sid", options);
    res.redirect("/login");
  });
};

/* ===========================
   Profile
=========================== */

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.render("profile", {
      user,
    });
  } catch (err) {
    console.log(err);
  }
};

/* ===========================
   Update Profile
=========================== */

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.phone = req.body.phone;
    user.gender = req.body.gender;
    user.address = req.body.address;
    user.city = req.body.city;
    user.state = req.body.state;
    user.pincode = req.body.pincode;

    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.log(err);
  }
};

/* =====================================
   Forgot Password
===================================== */

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/forgot-password", {
        title: "Forgot Password",

        success: "Password reset link has been sent to your email.",

        message: null,
      });
    }

    /* Generate Token */

    const resetToken = crypto.randomBytes(32).toString("hex");

    /* Hash Token */

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;

    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    /* Reset Link */

    const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

    /* Email */

    await sendEmail({
      to: user.email,

      subject: "DoctorCare Password Reset",

      html: `

            <div
            style="
            max-width:600px;
            margin:auto;
            font-family:Arial;
            ">

                <h2>

                    DoctorCare

                </h2>

                <p>

                    Hello ${user.firstName},

                </p>

                <p>

                    Click below to reset
                    your password.

                </p>

                <a

                href="${resetLink}"

                style="
                display:inline-block;
                padding:14px 28px;
                background:#2563eb;
                color:#fff;
                text-decoration:none;
                border-radius:8px;
                ">

                Reset Password

                </a>

                <p>

                    This link expires
                    in 15 minutes.

                </p>

            </div>

            `,
    });

    res.render("auth/forgot-password", {
      success: "Password reset link sent successfully.",

      message: null,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Internal Server Error");
  }
};

/* =====================================
   Reset Password
===================================== */

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password, confirmPassword } = req.body;

    // Check Password Match

    if (password !== confirmPassword) {
      return res.render("auth/reset-password", {
        token,

        message: "Passwords do not match.",
      });
    }

    // Hash Incoming Token

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find User

    const user = await User.findOne({
      passwordResetToken: hashedToken,

      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.render("auth/reset-password", {
        token,

        message: "Invalid or Expired Reset Link.",
      });
    }

    // Hash New Password

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    // Remove Reset Token

    user.passwordResetToken = null;

    user.passwordResetExpires = null;

    await user.save();

    res.render("auth/login", {
      success: "Password changed successfully.",

      message: null,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Internal Server Error");
  }
};

exports.getEducation = async (req, res) => {
  try {
    const doctor = await User.findById (req.user._id);
    if(!doctor) {
      return res.status(404).render("404");
    }
    const education = [...doctor.education];
    education.sort((a, b) => b.endYear - a.endYear);
    res.render("doctor/education/education",
      {
        title: "Education",
        user: doctor,
        education
      }
    );
  } catch(error){
    console.log(error);
    res.status(500).render("error");
  }
};
