const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/* ==========================================
   EDUCATION SCHEMA
========================================== */

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      trim: true,
    },

    college: {
      type: String,
      trim: true,
    },

    university: {
      type: String,
      trim: true,
    },

    startYear: Number,

    endYear: Number,
  },
  {
    _id: true,
  },
);

/* ==========================================
   EXPERIENCE SCHEMA
========================================== */

const experienceSchema = new mongoose.Schema(
  {
    hospital: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    startDate: Date,

    endDate: Date,

    current: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  },
);

/* ==========================================
   CERTIFICATE SCHEMA
========================================== */

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    issuedBy: {
      type: String,
      trim: true,
    },

    issueDate: Date,
  },
  {
    _id: true,
  },
);

/* ==========================================
   SOCIAL LINKS
========================================== */

const socialSchema = new mongoose.Schema(
  {
    linkedin: String,
    website: String,
    facebook: String,
    instagram: String,
    twitter: String,
  },
  {
    _id: false,
  },
);

/* ==========================================
   USER SCHEMA
========================================== */

const userSchema = new mongoose.Schema(
  {
    /* ===============================
       BASIC INFORMATION
    =============================== */

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid Email"],
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Invalid Phone Number"],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["admin", "doctor", "patient", "receptionist", "nurse"],
      default: "patient",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    dob: Date,

    profileImage: {
      type: String,
      default: "/images/default-user.png",
    },

    coverImage: {
      type: String,
      default: "/images/dashboard/doctor-cover.jpg",
    },

    /* ===============================
       ADDRESS
    =============================== */

    address: String,

    city: String,

    state: String,

    country: String,

    pincode: String,

    /* ===============================
       MEDICAL INFORMATION
    =============================== */

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },

    height: {
      type: Number,
      min: 30,
      max: 250,
    },

    weight: {
      type: Number,
      min: 1,
      max: 300,
    },

    allergies: {
      type: String,
      default: "",
    },

    medicalConditions: {
      type: String,
      default: "",
    },

    /* ===============================
       EMERGENCY CONTACT
    =============================== */

    emergencyContact: {
      type: String,
      default: "",
    },

    emergencyPhone: {
      type: String,
      default: "",
    },

    /* ===============================
       INSURANCE
    =============================== */

    insuranceProvider: {
      type: String,
      default: "",
    },

    insuranceNumber: {
      type: String,
      default: "",
    },

    insuranceExpiry: Date,

    /* ===============================
       ACCOUNT
    =============================== */

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLogin: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,
    /* Identity references only. Aadhaar values and biometric material never belong here. */
    aadhaarReferenceId: { type: String, unique: true, sparse: true, select: false },
    identityVerified: { type: Boolean, default: false },
    identityVerificationStatus: { type: String, enum: ["pending", "in_progress", "verified", "failed"], default: "pending" },
    identityVerifiedAt: Date,
    identityVerificationProvider: { type: String, trim: true },
    faceVerificationStatus: { type: String, enum: ["not_started", "pending", "verified", "failed"], default: "not_started" },
    faceVerifiedAt: Date,
    /* ===============================
       DOCTOR PROFILE
    =============================== */

    qualification: {
      type: String,
      trim: true,
    },

    specialization: {
      type: String,
      trim: true,
    },

    registrationNumber: {
      type: String,
      trim: true,
    },

    hospital: {
      type: String,
      trim: true,
    },

    clinic: {
      type: String,
      trim: true,
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    onlineConsultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    followUpDays: {
      type: Number,
      default: 7,
    },

    bio: {
      type: String,
      maxlength: 1000,
    },

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    education: [educationSchema],

    experienceDetails: [experienceSchema],

    certificates: [certificateSchema],

    socialLinks: {
      type: socialSchema,
      default: () => ({}),
    },

    awards: [
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    organization: {
      type: String,
      required: true,
      trim: true,
    },

    awardDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    certificate: {
      type: String,
      default: "",
    },
  },
],



    memberships: [
      {
        type: String,
        trim: true,
      },
    ],

    profileCompletion: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    availability: [
      {
        day: String,

        startTime: String,

        endTime: String,

        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);
/* ==========================================
   HASH PASSWORD BEFORE SAVE
========================================== */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

/* ==========================================
   COMPARE PASSWORD
========================================== */

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/* ==========================================
   FULL NAME VIRTUAL
========================================== */

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/* ==========================================
   REMOVE PASSWORD FROM JSON RESPONSE
========================================== */

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;

  return user;
};

userSchema.index({
  role: 1,

  specialization: 1,
});

userSchema.index({
  registrationNumber: 1,
});

userSchema.methods.calculateProfileCompletion = function () {
  let completed = 0;

  const fields = [
    this.profileImage,

    this.qualification,

    this.specialization,

    this.registrationNumber,

    this.hospital,

    this.bio,

    this.languages?.length,

    this.education?.length,

    this.experienceDetails?.length,

    this.certificates?.length,
  ];

  fields.forEach((field) => {
    if (field) {
      completed++;
    }
  });

  this.profileCompletion = Math.round((completed / fields.length) * 100);

  return this.profileCompletion;
};
userSchema.pre("save", function () {
  if (this.role === "doctor") {
    this.calculateProfileCompletion();
  }
});

const awardSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    organization: {
        type: String,
        required: true,
        trim: true
    },

    awardDate: {
        type: Date,
        required: true
    },

    description: {
        type: String,
        trim: true
    },

    certificate: {
        type: String,
        default: ""
    }

}, { timestamps: true });


/* ==========================================
   EXPORT MODEL
========================================== */

module.exports = mongoose.model("User", userSchema);
