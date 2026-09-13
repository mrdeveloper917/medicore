const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Notification = require("../models/Notification");
const MedicalHistory = require("../models/MedicalHistory");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { notify } = require("../services/notificationService");


const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");

const Report = require("../models/Report");

const { validationResult } = require("express-validator");

// ==========================================
// DOCTOR DASHBOARD
// ==========================================

exports.dashboard = async (req, res) => {
  try {
    const user = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      doctor: user._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: {
        $ne: "Cancelled",
      },
    })
      .populate("patient")
      .sort({
        appointmentTime: 1,
      })
      .limit(5);

    const upcomingAppointments = await Appointment.find({
      doctor: user._id,
      appointmentDate: {
        $gte: today,
      },
      status: {
        $ne: "Cancelled",
      },
    })
      .populate("patient")
      .sort({
        appointmentDate: 1,
        appointmentTime: 1,
      })
      .limit(5);

    const totalPatients = await Appointment.distinct("patient", {
      doctor: user._id,
      status: {
        $ne: "Cancelled",
      },
    });

    const pendingPrescriptions =
      await Prescription.countDocuments({
        doctor: user._id,
      });

    const recentPrescriptions =
      await Prescription.find({
        doctor: user._id,
      })
        .populate("patient")
        .sort({
          createdAt: -1,
        })
        .limit(5);

    const recentAppointments =
      await Appointment.find({
        doctor: user._id,
        status: {
          $ne: "Cancelled",
        },
      })
        .populate("patient")
        .sort({
          appointmentDate: -1,
          appointmentTime: -1,
        })
        .limit(10);

    const recentPatients = [];
    const patientIds = new Set();

    recentAppointments.forEach(
      (appointment) => {
        if (
          appointment.patient &&
          !patientIds.has(
            appointment.patient._id.toString()
          )
        ) {
          patientIds.add(
            appointment.patient._id.toString()
          );

          recentPatients.push(
            appointment.patient
          );
        }
      }
    );

    const completedAppointments =
      await Appointment.countDocuments({
        doctor: user._id,
        status: "Completed",
      });

    const pendingAppointments =
      await Appointment.countDocuments({
        doctor: user._id,
        status: "Pending",
      });

    const cancelledAppointments =
      await Appointment.countDocuments({
        doctor: user._id,
        status: "Cancelled",
      });

    const allAppointments =
      await Appointment.countDocuments({
        doctor: user._id,
      });

    const notifications =
      await Notification.find({
        user: user._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5);

    const stats = {
      todayAppointments:
        todayAppointments.length,

      totalPatients:
        totalPatients.length,

      pendingPrescriptions,

      monthlyRevenue: 0,
    };

    const consultation = {
      completed:
        completedAppointments,

      pending:
        pendingAppointments,

      cancelled:
        cancelledAppointments,

      total:
        allAppointments,
    };

    
// ============================================================
// DOCTOR REVENUE
// Only verified/paid payments are counted
// ============================================================

const now = new Date();

// ------------------------------------------------------------
// TODAY
// ------------------------------------------------------------

const startOfToday = new Date(now);

startOfToday.setHours(
    0,
    0,
    0,
    0
);

const endOfToday = new Date(
    startOfToday
);

endOfToday.setDate(
    endOfToday.getDate() + 1
);


// ------------------------------------------------------------
// WEEK - MONDAY TO SUNDAY
// ------------------------------------------------------------

const startOfWeek = new Date(now);

startOfWeek.setHours(
    0,
    0,
    0,
    0
);

const currentDay =
    startOfWeek.getDay();

const mondayDifference =
    currentDay === 0
        ? 6
        : currentDay - 1;

startOfWeek.setDate(
    startOfWeek.getDate() -
    mondayDifference
);

const endOfWeek =
    new Date(startOfWeek);

endOfWeek.setDate(
    endOfWeek.getDate() + 7
);


// ------------------------------------------------------------
// MONTH
// ------------------------------------------------------------

const startOfMonth =
    new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

const endOfMonth =
    new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
    );


// ------------------------------------------------------------
// GET PAID PAYMENTS
// ------------------------------------------------------------

const paidPayments =
    await Payment.find({

        doctor:
            user._id,

        status:
            "Paid",

        paidAt:
            { $ne: null }

    }).select(
        "amount paidAt"
    );


// ------------------------------------------------------------
// CALCULATE REVENUE
// ------------------------------------------------------------

let todayRevenue = 0;
let weekRevenue = 0;
let monthRevenue = 0;
let totalRevenue = 0;

paidPayments.forEach(
    (payment) => {

        const amount =
            Number(
                payment.amount || 0
            );

        const paidAt =
            new Date(
                payment.paidAt
            );

        // TOTAL
        totalRevenue += amount;


        // TODAY
        if (
            paidAt >= startOfToday &&
            paidAt < endOfToday
        ) {

            todayRevenue +=
                amount;
        }


        // WEEK
        if (
            paidAt >= startOfWeek &&
            paidAt < endOfWeek
        ) {

            weekRevenue +=
                amount;
        }


        // MONTH
        if (
            paidAt >= startOfMonth &&
            paidAt < endOfMonth
        ) {

            monthRevenue +=
                amount;
        }

    }
);


// ------------------------------------------------------------
// FINAL REVENUE OBJECT
// ------------------------------------------------------------

const revenue = {

    today:
        todayRevenue,

    week:
        weekRevenue,

    month:
        monthRevenue,

    total:
        totalRevenue
};

    const performance = {
      rating: 0,
      successRate: 0,
      experience: 0,
      reviews: 0,
    };

    const weekly = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };

    const goals = {
      completed: 0,
    };

    const activities = [];

    res.render(
      "doctor/dashboard",
      {
        title: "Doctor Dashboard",

        user,

        stats,

        todayAppointments,

        upcomingAppointments,

        recentPatients,

        recentPrescriptions,

        consultation,

        notifications,

        revenue,

        performance,

        weekly,

        goals,

        activities,
      }
    );
  } catch (err) {
    console.log(err);

    res.status(500).send(
      "Doctor Dashboard Error"
    );
  }
};

// ==========================================
// DOCTOR PROFILE
// ==========================================

exports.profile = async (req, res) => {
  try {
    res.render(
      "doctor/profile",
      {
        title: "Doctor Profile",

        user: req.user,
      }
    );
  } catch (err) {
    console.log(err);

    res.status(500).send(
      "Doctor Profile Error"
    );
  }
};

// ==========================================
// GET DASHBOARD
// ==========================================

exports.getDashboard = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    res.render(
      "doctor/dashboard",
      {
        title: "Doctor Dashboard",

        user: doctor,
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// GET PROFILE
// ==========================================

exports.getProfile = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      doctor.experienceDetails || [];

    const activeExperience =
      experience.filter(
        (item) =>
          !item.isDeleted
      );

    const experienceSummary =
      activeExperience.length;

    res.render(
      "doctor/profile",
      {
        title: "Doctor Profile",

        user: doctor,

        doctor,

        experienceSummary,
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// GET EDIT PROFILE
// ==========================================

exports.getEditProfile = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    res.render(
      "doctor/editProfile",
      {
        title: "Edit Profile",

        user: doctor,
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// GET EXPERIENCE
// ==========================================

exports.getExperience = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      (doctor.experienceDetails || [])
        .filter(
          (item) =>
            !item.isDeleted
        )
        .sort(
          (a, b) =>
            new Date(b.startDate) -
            new Date(a.startDate)
        );

    res.render(
      "doctor/experience/experience",
      {
        title: "Experience",

        user: doctor,

        experience,

        error: null,

        success: null,
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// UPDATE DOCTOR PROFILE
// ==========================================

// ============================================================
// UPDATE DOCTOR PROFILE
// POST /doctor/profile/update
// ============================================================

exports.updateProfile = async (req, res) => {
    try {

        console.log("=================================");
        console.log("UPDATE DOCTOR PROFILE");
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        console.log("=================================");

        // --------------------------------------------------------
        // GET CURRENT DOCTOR
        // --------------------------------------------------------

        const doctor = await User.findById(req.user._id);

        if (!doctor) {
            return res.status(404).render("404");
        }

        // --------------------------------------------------------
        // SAFELY READ BODY
        // --------------------------------------------------------

        const body = req.body || {};

        // --------------------------------------------------------
        // REQUIRED FIELDS
        // --------------------------------------------------------

        const firstName = String(
            body.firstName || ""
        ).trim();

        const lastName = String(
            body.lastName || ""
        ).trim();

        const phone = String(
            body.phone || ""
        ).trim();

        if (!firstName || !lastName || !phone) {

            return res.status(400).render(
                "doctor/editProfile",
                {
                    title: "Edit Profile",

                    // VERY IMPORTANT
                    user: doctor,

                    error:
                        "First name, last name and phone are required.",

                    success: null
                }
            );
        }

        // --------------------------------------------------------
        // BASIC INFORMATION
        // --------------------------------------------------------

        doctor.firstName = firstName;
        doctor.lastName = lastName;
        doctor.phone = phone;

        if (body.email !== undefined) {
            doctor.email =
                String(body.email).trim();
        }

        // --------------------------------------------------------
        // PROFESSIONAL INFORMATION
        // --------------------------------------------------------

        if (body.specialization !== undefined) {

            doctor.specialization =
                String(
                    body.specialization
                ).trim();
        }

        if (body.registrationNumber !== undefined) {

            doctor.registrationNumber =
                String(
                    body.registrationNumber
                ).trim();
        }

        // Support both field names
        if (body.hospital !== undefined) {

            doctor.hospital =
                String(body.hospital).trim();

        } else if (body.hostipal !== undefined) {

            doctor.hostipal =
                String(body.hostipal).trim();
        }

        if (body.clinic !== undefined) {

            doctor.clinic =
                String(body.clinic).trim();
        }

        // --------------------------------------------------------
        // EXPERIENCE
        // --------------------------------------------------------

        if (
            body.experience !== undefined &&
            body.experience !== ""
        ) {

            const experience =
                Number(body.experience);

            if (
                !Number.isFinite(experience) ||
                experience < 0
            ) {
                return res.status(400).render(
                    "doctor/editProfile",
                    {
                        title: "Edit Profile",
                        user: doctor,
                        error:
                            "Please enter a valid experience.",
                        success: null
                    }
                );
            }

            doctor.experience =
                experience;
        }

        // --------------------------------------------------------
        // CONSULTATION FEE
        // --------------------------------------------------------

        if (
            body.consultationFee !== undefined &&
            body.consultationFee !== ""
        ) {

            const fee =
                Number(body.consultationFee);

            if (
                !Number.isFinite(fee) ||
                fee < 0
            ) {
                return res.status(400).render(
                    "doctor/editProfile",
                    {
                        title: "Edit Profile",
                        user: doctor,
                        error:
                            "Please enter a valid consultation fee.",
                        success: null
                    }
                );
            }

            doctor.consultationFee = fee;
        }

        // --------------------------------------------------------
        // ONLINE CONSULTATION FEE
        // --------------------------------------------------------

        if (
            body.onlineConsultationFee !== undefined &&
            body.onlineConsultationFee !== ""
        ) {

            const onlineFee =
                Number(
                    body.onlineConsultationFee
                );

            if (
                !Number.isFinite(onlineFee) ||
                onlineFee < 0
            ) {
                return res.status(400).render(
                    "doctor/editProfile",
                    {
                        title: "Edit Profile",
                        user: doctor,
                        error:
                            "Please enter a valid online consultation fee.",
                        success: null
                    }
                );
            }

            doctor.onlineConsultationFee =
                onlineFee;
        }

        // --------------------------------------------------------
        // FOLLOW UP DAYS
        // --------------------------------------------------------

        if (
            body.followUpDays !== undefined &&
            body.followUpDays !== ""
        ) {

            const days =
                Number(body.followUpDays);

            if (
                !Number.isFinite(days) ||
                days < 0
            ) {
                return res.status(400).render(
                    "doctor/editProfile",
                    {
                        title: "Edit Profile",
                        user: doctor,
                        error:
                            "Please enter valid follow-up days.",
                        success: null
                    }
                );
            }

            doctor.followUpDays = days;
        }

        // --------------------------------------------------------
        // BIO
        // --------------------------------------------------------

        if (body.bio !== undefined) {

            doctor.bio =
                String(body.bio).trim();
        }

        // --------------------------------------------------------
        // LANGUAGES
        // --------------------------------------------------------

        if (body.languages !== undefined) {

            doctor.languages =
                Array.isArray(body.languages)
                    ? body.languages
                    : [body.languages];
        }

        // --------------------------------------------------------
        // PROFILE IMAGE
        // --------------------------------------------------------

        if (
            req.files &&
            req.files.profileImage &&
            req.files.profileImage.length > 0
        ) {

            doctor.profileImage =
                "/uploads/doctors/profile/" +
                req.files.profileImage[0].filename;
        }

        // --------------------------------------------------------
        // COVER IMAGE
        // --------------------------------------------------------

        if (
            req.files &&
            req.files.coverImage &&
            req.files.coverImage.length > 0
        ) {

            doctor.coverImage =
                "/uploads/doctors/cover/" +
                req.files.coverImage[0].filename;
        }

        // --------------------------------------------------------
        // SAVE
        // --------------------------------------------------------

        await doctor.save();

        console.log(
            "Doctor profile updated successfully:",
            doctor._id
        );

        // --------------------------------------------------------
        // REDIRECT
        // --------------------------------------------------------

        return res.redirect(
            "/doctor/profile"
        );

    } catch (error) {

        console.error(
            "UPDATE DOCTOR PROFILE ERROR:",
            error
        );

        let doctor = null;

        try {
            doctor = await User.findById(
                req.user._id
            );
        } catch (dbError) {
            console.error(
                "Doctor reload error:",
                dbError
            );
        }

        return res.status(500).render(
            "doctor/editProfile",
            {
                title: "Edit Profile",

                user: doctor || {},

                error:
                    error.message ||
                    "Unable to update profile.",

                success: null
            }
        );
    }
};

// ==========================================
// GET CERTIFICATES
// ==========================================

exports.getCertificates = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.redirect("/login");
    }

    res.render(
      "doctor/certificates/certificates",
      {
        title: "My Certificates",

        user: doctor,

        certificates:
          doctor.certificates || [],
      }
    );
  } catch (error) {
    console.error(
      "Get Certificates Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// GET ADD CERTIFICATE PAGE
// ==========================================

exports.getAddCertificate = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.redirect("/login");
    }

    res.render(
      "doctor/certificates/addCertificate",
      {
        title: "Upload Certificate",

        user,
      }
    );
  } catch (error) {
    console.error(
      "Get Add Certificate Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// UPLOAD CERTIFICATE
// ==========================================

exports.uploadCertificate = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.redirect("/login");
    }

    if (!req.file) {
      return res
        .status(400)
        .send(
          "Please upload a certificate."
        );
    }

    if (
      !req.body.title ||
      !req.body.issuedBy ||
      !req.body.issueDate
    ) {
      return res
        .status(400)
        .send(
          "All certificate fields are required."
        );
    }

    if (!doctor.certificates) {
      doctor.certificates = [];
    }

    doctor.certificates.push({
      title:
        req.body.title.trim(),

      image:
        "/uploads/doctors/certificates/" +
        req.file.filename,

      issuedBy:
        req.body.issuedBy.trim(),

      issueDate:
        req.body.issueDate,
    });

    await doctor.save();

    return res.redirect(
      "/doctor/certificates"
    );
  } catch (error) {
    console.error(
      "Upload Certificate Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// DELETE CERTIFICATE
// ==========================================

exports.deleteCertificate = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.redirect("/login");
    }

    const certificate =
      doctor.certificates.id(
        req.params.id
      );

    if (!certificate) {
      return res
        .status(404)
        .send(
          "Certificate not found."
        );
    }

    certificate.deleteOne();

    await doctor.save();

    return res.redirect(
      "/doctor/certificates"
    );
  } catch (error) {
    console.error(
      "Delete Certificate Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// GET EDUCATION
// ==========================================

exports.getEducation = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const education =
      (doctor.education || [])
        .filter(
          (item) =>
            !item.isDeleted
        );

    res.render(
      "doctor/education/education",
      {
        title: "Education",

        user: doctor,

        education,
      }
    );
  } catch (error) {
    console.error(error);

    res.status(500).render("error");
  }
};

// ==========================================
// GET ADD EDUCATION
// ==========================================

exports.getAddEducation = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).render("404");
    }

    res.render(
      "doctor/education/addEducation",
      {
        title: "Add Education",

        user,

        errors: [],

        old: {},
      }
    );
  } catch (error) {
    console.error(error);

    res.status(500).render("error");
  }
};

// ==========================================
// ADD EDUCATION
// ==========================================

exports.addEducation = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const degree =
      req.body.degree
        ? req.body.degree.trim()
        : "";

    const college =
      req.body.college
        ? req.body.college.trim()
        : "";

    const university =
      req.body.university
        ? req.body.university.trim()
        : "";

    const exists =
      (doctor.education || []).some(
        (item) =>
          !item.isDeleted &&
          item.degree &&
          item.college &&
          item.university &&
          item.degree
            .toLowerCase() ===
            degree.toLowerCase() &&
          item.college
            .toLowerCase() ===
            college.toLowerCase() &&
          item.university
            .toLowerCase() ===
            university.toLowerCase()
      );

    if (exists) {
      return res.render(
        "doctor/education/addEducation",
        {
          title: "Add Education",

          user: doctor,

          error:
            "Education already exists.",

          errors: [],

          old: req.body,
        }
      );
    }

    const errors =
      validationResult(req);

    if (!errors.isEmpty()) {
      return res.render(
        "doctor/education/addEducation",
        {
          title: "Add Education",

          user: doctor,

          errors: errors.array(),

          old: req.body,
        }
      );
    }

    if (!doctor.education) {
      doctor.education = [];
    }

    doctor.education.push({
      degree,

      college,

      university,

      startYear:
        Number(req.body.startYear),

      endYear:
        Number(req.body.endYear),
    });

    await doctor.save();

    return res.redirect(
      "/doctor/education"
    );
  } catch (error) {
    console.error(
      "Add Education Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// GET EDIT EDUCATION
// ==========================================

exports.getEditEducation = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const education =
      doctor.education.id(
        req.params.id
      );

    if (!education) {
      return res.status(404).render("404");
    }

    res.render(
      "doctor/education/editEducation",
      {
        title: "Edit Education",

        user: doctor,

        education,
      }
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// UPDATE EDUCATION
// ==========================================

exports.updateEducation = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const education =
      doctor.education.id(
        req.params.id
      );

    if (!education) {
      return res.status(404).render("404");
    }

    education.degree =
      req.body.degree;

    education.college =
      req.body.college;

    education.university =
      req.body.university;

    education.startYear =
      req.body.startYear;

    education.endYear =
      req.body.endYear;

    await doctor.save();

    return res.redirect(
      "/doctor/education"
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// DELETE EDUCATION
// ==========================================

exports.deleteEducation = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const education =
      doctor.education.id(
        req.params.id
      );

    if (!education) {
      return res.status(404).render("404");
    }

    education.isDeleted = true;

    education.deletedAt =
      new Date();

    await doctor.save();

    return res.redirect(
      "/doctor/education"
    );
  } catch (error) {
    console.log(error);

    res.status(500).render("error");
  }
};

// ==========================================
// EXPERIENCE ROUTES
// ==========================================

// ==========================================
// GET ADD EXPERIENCE
// ==========================================

exports.getAddExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.redirect("/login");
    }

    res.render("doctor/experience/addExperience", {
      title: "Add Experience",
      user,
      errors: [],
      old: {},
    });
  } catch (error) {
    console.error(
      "Get Add Experience Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// ADD EXPERIENCE
// ==========================================

exports.addExperience = async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id);

    if (!doctor) {
      return res.status(404).render("404");
    }

    const {
      hospital,
      position,
      startDate,
      endDate,
      current,
    } = req.body;

    // ----------------------------------------
    // Required validation
    // ----------------------------------------

    if (
      !hospital ||
      !position ||
      !startDate
    ) {
      return res.render(
        "doctor/experience/addExperience",
        {
          title: "Add Experience",
          user: doctor,
          error:
            "Hospital, Position and Start Date are required.",
          errors: [],
          old: req.body,
        }
      );
    }

    // ----------------------------------------
    // End date validation
    // ----------------------------------------

    if (
      current !== "on" &&
      !endDate
    ) {
      return res.render(
        "doctor/experience/addExperience",
        {
          title: "Add Experience",
          user: doctor,
          error:
            "End Date is required if this is not your current job.",
          errors: [],
          old: req.body,
        }
      );
    }

    // ----------------------------------------
    // Validate dates
    // ----------------------------------------

    const start = new Date(startDate);

    if (isNaN(start.getTime())) {
      return res.render(
        "doctor/experience/addExperience",
        {
          title: "Add Experience",
          user: doctor,
          error:
            "Please enter a valid start date.",
          errors: [],
          old: req.body,
        }
      );
    }

    let end = null;

    if (
      current !== "on" &&
      endDate
    ) {
      end = new Date(endDate);

      if (isNaN(end.getTime())) {
        return res.render(
          "doctor/experience/addExperience",
          {
            title: "Add Experience",
            user: doctor,
            error:
              "Please enter a valid end date.",
            errors: [],
            old: req.body,
          }
        );
      }

      if (end < start) {
        return res.render(
          "doctor/experience/addExperience",
          {
            title: "Add Experience",
            user: doctor,
            error:
              "End Date cannot be before Start Date.",
            errors: [],
            old: req.body,
          }
        );
      }
    }

    // ----------------------------------------
    // Express-validator
    // ----------------------------------------

    const errors =
      validationResult(req);

    if (!errors.isEmpty()) {
      return res.render(
        "doctor/experience/addExperience",
        {
          title: "Add Experience",
          user: doctor,
          errors: errors.array(),
          old: req.body,
        }
      );
    }

    // ----------------------------------------
    // Initialize experience array
    // ----------------------------------------

    if (!doctor.experienceDetails) {
      doctor.experienceDetails = [];
    }

    // ----------------------------------------
    // Add experience
    // ----------------------------------------

    doctor.experienceDetails.push({
      hospital: hospital.trim(),

      position: position.trim(),

      startDate: start,

      endDate:
        current === "on"
          ? null
          : end,

      current:
        current === "on",

      isDeleted: false,

      deletedAt: null,
    });

    await doctor.save();

    return res.redirect(
      "/doctor/experience"
    );
  } catch (error) {
    console.error(
      "Add Experience Error:",
      error
    );

    return res.status(500).render(
      "doctor/experience/addExperience",
      {
        title: "Add Experience",
        user: req.user,
        error:
          "Something went wrong. Please try again.",
        errors: [],
        old: req.body,
      }
    );
  }
};

// ==========================================
// GET EXPERIENCE
// ==========================================

exports.getExperience = async (req, res) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      (doctor.experienceDetails || [])
        .filter(
          (item) =>
            !item.isDeleted
        )
        .sort(
          (a, b) =>
            new Date(b.startDate) -
            new Date(a.startDate)
        );

    return res.render(
      "doctor/experience/experience",
      {
        title: "Experience",

        user: doctor,

        experience,

        error: null,

        success: null,
      }
    );
  } catch (error) {
    console.error(
      "Get Experience Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// GET EDIT EXPERIENCE
// ==========================================

exports.getEditExperience = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      doctor.experienceDetails.id(
        req.params.id
      );

    if (!experience) {
      return res.status(404).render("404");
    }

    if (experience.isDeleted) {
      return res.status(404).render("404");
    }

    res.render(
      "doctor/experience/editExperience",
      {
        title: "Edit Experience",

        user: doctor,

        experience,

        error: null,

        errors: [],
      }
    );
  } catch (error) {
    console.error(
      "Get Edit Experience Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// UPDATE EXPERIENCE
// ==========================================

exports.updateExperience = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      doctor.experienceDetails.id(
        req.params.id
      );

    if (!experience) {
      return res.status(404).render("404");
    }

    const {
      hospital,
      position,
      startDate,
      endDate,
      current,
    } = req.body;

    // ----------------------------------------
    // Required validation
    // ----------------------------------------

    if (
      !hospital ||
      !position ||
      !startDate
    ) {
      return res.render(
        "doctor/experience/editExperience",
        {
          title: "Edit Experience",
          user: doctor,
          experience,
          error:
            "Hospital, Position and Start Date are required.",
          errors: [],
        }
      );
    }

    // ----------------------------------------
    // Current job / End date validation
    // ----------------------------------------

    if (
      current !== "on" &&
      !endDate
    ) {
      return res.render(
        "doctor/experience/editExperience",
        {
          title: "Edit Experience",
          user: doctor,
          experience,
          error:
            "End Date is required if this is not your current job.",
          errors: [],
        }
      );
    }

    // ----------------------------------------
    // Date validation
    // ----------------------------------------

    const start =
      new Date(startDate);

    if (isNaN(start.getTime())) {
      return res.render(
        "doctor/experience/editExperience",
        {
          title: "Edit Experience",
          user: doctor,
          experience,
          error:
            "Please enter a valid start date.",
          errors: [],
        }
      );
    }

    let end = null;

    if (
      current !== "on" &&
      endDate
    ) {
      end = new Date(endDate);

      if (isNaN(end.getTime())) {
        return res.render(
          "doctor/experience/editExperience",
          {
            title: "Edit Experience",
            user: doctor,
            experience,
            error:
              "Please enter a valid end date.",
            errors: [],
          }
        );
      }

      if (end < start) {
        return res.render(
          "doctor/experience/editExperience",
          {
            title: "Edit Experience",
            user: doctor,
            experience,
            error:
              "End Date cannot be before Start Date.",
            errors: [],
          }
        );
      }
    }

    // ----------------------------------------
    // Update
    // ----------------------------------------

    experience.hospital =
      hospital.trim();

    experience.position =
      position.trim();

    experience.startDate =
      start;

    experience.current =
      current === "on";

    experience.endDate =
      current === "on"
        ? null
        : end;

    await doctor.save();

    return res.redirect(
      "/doctor/experience"
    );
  } catch (error) {
    console.error(
      "Update Experience Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// DELETE EXPERIENCE
// ==========================================

exports.deleteExperience = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const experience =
      doctor.experienceDetails.id(
        req.params.id
      );

    if (!experience) {
      return res.status(404).render("404");
    }

    // ----------------------------------------
    // Soft delete
    // ----------------------------------------

    experience.isDeleted = true;

    experience.deletedAt =
      new Date();

    await doctor.save();

    return res.redirect(
      "/doctor/experience"
    );
  } catch (error) {
    console.error(
      "Delete Experience Error:",
      error
    );

    return res.status(500).render("error");
  }
};


// ==================================================
// AWARDS
// ==================================================

// ==========================================
// GET ADD AWARD
// ==========================================

exports.getAddAward = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.redirect("/login");
    }

    res.render(
      "doctor/awards/addAward",
      {
        title: "Add Award",

        user,

        error: null,

        success: null,

        old: {},
      }
    );
  } catch (error) {
    console.error(
      "Get Add Award Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// ADD AWARD
// ==========================================

exports.addAward = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const {
      title,
      organization,
      awardDate,
      description,
    } = req.body;

    // ----------------------------------------
    // Required validation
    // ----------------------------------------

    if (
      !title ||
      !organization ||
      !awardDate
    ) {
      return res.render(
        "doctor/awards/addAward",
        {
          title: "Add Award",

          user: doctor,

          error:
            "Title, Organization and Award Date are required.",

          success: null,

          old: req.body,
        }
      );
    }

    // ----------------------------------------
    // Date validation
    // ----------------------------------------

    const date =
      new Date(awardDate);

    if (isNaN(date.getTime())) {
      return res.render(
        "doctor/awards/addAward",
        {
          title: "Add Award",

          user: doctor,

          error:
            "Please enter a valid award date.",

          success: null,

          old: req.body,
        }
      );
    }

    // ----------------------------------------
    // Initialize awards
    // ----------------------------------------

    if (!doctor.awards) {
      doctor.awards = [];
    }

    // ----------------------------------------
    // Certificate filename
    // ----------------------------------------

    let certificate = "";

    if (req.file) {
      certificate =
        req.file.filename;
    }

    // ----------------------------------------
    // Add award
    // ----------------------------------------

    doctor.awards.push({
      title: title.trim(),

      organization:
        organization.trim(),

      awardDate: date,

      description:
        description
          ? description.trim()
          : "",

      certificate,
    });

    await doctor.save();

    return res.redirect(
      "/doctor/awards"
    );
  } catch (error) {
    console.error(
      "Add Award Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// GET AWARDS
// ==========================================

exports.getAwards = async (
  req,
  res
) => {
  try {
    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const awards =
      (doctor.awards || [])
        .filter(
          (item) =>
            !item.isDeleted
        )
        .sort(
          (a, b) =>
            new Date(b.awardDate) -
            new Date(a.awardDate)
        );

    return res.render(
      "doctor/awards/awards",
      {
        title: "Awards",

        user: doctor,

        doctor,

        awards,
      }
    );
  } catch (error) {
    console.error(
      "Get Awards Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// GET EDIT AWARD
// ==========================================

exports.getEditAward = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const award =
      doctor.awards.id(
        req.params.id
      );

    if (!award) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    res.render(
      "doctor/awards/editAward",
      {
        title: "Edit Award",

        user: doctor,

        award,

        error: null,

        success: null,
      }
    );
  } catch (error) {
    console.error(
      "Get Edit Award Error:",
      error
    );

    res.status(500).render("error");
  }
};

// ==========================================
// UPDATE AWARD
// ==========================================

exports.updateAward = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    const award =
      doctor.awards.id(
        req.params.id
      );

    if (!award) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    const {
      title,
      organization,
      awardDate,
      description,
    } = req.body;

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (
      !title ||
      !organization ||
      !awardDate
    ) {
      return res.render(
        "doctor/awards/editAward",
        {
          title: "Edit Award",

          user: doctor,

          award,

          error:
            "Title, Organization and Award Date are required.",

          success: null,
        }
      );
    }

    const date =
      new Date(awardDate);

    if (isNaN(date.getTime())) {
      return res.render(
        "doctor/awards/editAward",
        {
          title: "Edit Award",

          user: doctor,

          award,

          error:
            "Please enter a valid award date.",

          success: null,
        }
      );
    }

    // ----------------------------------------
    // Update fields
    // ----------------------------------------

    award.title =
      title.trim();

    award.organization =
      organization.trim();

    award.awardDate =
      date;

    award.description =
      description
        ? description.trim()
        : "";

    // ----------------------------------------
    // Replace certificate if uploaded
    // ----------------------------------------

    if (req.file) {
      const oldCertificate =
        award.certificate;

      award.certificate =
        req.file.filename;

      // Delete old certificate
      if (oldCertificate) {
        const oldPath =
          path.join(
            "public",
            "uploads",
            "doctors",
            "awards",
            oldCertificate
          );

        if (
          fs.existsSync(oldPath)
        ) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    await doctor.save();

    return res.redirect(
      "/doctor/awards"
    );
  } catch (error) {
    console.error(
      "Update Award Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==========================================
// DELETE AWARD
// ==========================================

exports.deleteAward = async (
  req,
  res
) => {
  try {
    // ----------------------------------------
    // Validate ObjectId
    // ----------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    // ----------------------------------------
    // Find doctor
    // ----------------------------------------

    const doctor =
      await User.findById(
        req.user._id
      );

    if (!doctor) {
      return res.status(404).render("404");
    }

    // ----------------------------------------
    // Find award
    // ----------------------------------------

    const award =
      doctor.awards.id(
        req.params.id
      );

    if (!award) {
      return res.redirect(
        "/doctor/awards"
      );
    }

    // ----------------------------------------
    // Store certificate
    // ----------------------------------------

    const certificate =
      award.certificate;

    // ----------------------------------------
    // Delete award
    // ----------------------------------------

    award.deleteOne();

    await doctor.save();

    // ----------------------------------------
    // Delete certificate file
    // ----------------------------------------

    if (certificate) {
      const certificatePath =
        path.join(
          "public",
          "uploads",
          "doctors",
          "awards",
          certificate
        );

      if (
        fs.existsSync(
          certificatePath
        )
      ) {
        fs.unlinkSync(
          certificatePath
        );
      }
    }

    return res.redirect(
      "/doctor/awards"
    );
  } catch (error) {
    console.error(
      "Delete Award Error:",
      error
    );

    return res.status(500).render("error");
  }
};

// ==================================================
// DOCTOR APPOINTMENTS
// ==================================================

// ==========================================
// GET ALL APPOINTMENTS
// ==========================================

exports.getAppointments = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const appointments =
      await Appointment.find({
        doctor: doctorId,
      })
        .populate(
          "patient",
          "firstName lastName email phone profileImage"
        )
        .sort({
          appointmentDate: -1,
          appointmentTime: -1,
        });

    // ----------------------------------------
    // Appointment Statistics
    // ----------------------------------------

    const totalAppointments =
      appointments.length;

    const pendingAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "Pending"
      ).length;

    const approvedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "Approved"
      ).length;

    const completedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "Completed"
      ).length;

    const cancelledAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "Cancelled"
      ).length;

    const stats = {
      total: totalAppointments,

      pending:
        pendingAppointments,

      approved:
        approvedAppointments,

      completed:
        completedAppointments,

      cancelled:
        cancelledAppointments,
    };

    // ----------------------------------------
    // Render Appointments
    // ----------------------------------------

    return res.render(
      "doctor/appointments/appointments",
      {
        title: "Appointments",

        user: req.user,

        appointments,

        stats,
      }
    );
  } catch (error) {
    console.error(
      "Get Doctor Appointments Error:",
      error
    );

    return res.status(500).send(
      "Unable to load appointments"
    );
  }
};

// ==========================================
// GET APPOINTMENT DETAILS
// ==========================================

exports.getAppointmentDetails = async (
  req,
  res
) => {
  try {
    // ----------------------------------------
    // Find appointment
    // ----------------------------------------

    const appointment =
      await Appointment.findOne({
        _id: req.params.id,

        doctor: req.user._id,
      })
        .populate(
          "patient",
          "firstName lastName email phone profileImage"
        )
        .populate(
          "doctor",
          "firstName lastName specialization"
        );

    // ----------------------------------------
    // Appointment not found
    // ----------------------------------------

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ========================================
    // IMPORTANT FIX
    // Get medical record
    // ========================================

    const medicalRecord =
      await MedicalHistory.findOne({
        appointment:
          appointment._id,

        doctor:
          req.user._id,
      }).lean();

    // ========================================
    // Render appointment details
    // ========================================

    return res.render(
      "doctor/appointments/details",
      {
        title:
          "Appointment Details",

        user: req.user,

        appointment,

        medicalRecord,
      }
    );
  } catch (error) {
    console.error(
      "Get Appointment Details Error:",
      error
    );

    return res.status(500).send(
      "Unable to load appointment details"
    );
  }
};

// ==========================================
// APPROVE APPOINTMENT
// ==========================================

exports.approveAppointment = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.user._id;

    const appointmentId =
      req.params.id;

    // ----------------------------------------
    // Find appointment
    // ----------------------------------------

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,

        doctor: doctorId,
      });

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ----------------------------------------
    // Only pending appointment
    // ----------------------------------------

    if (
      appointment.status !==
      "Pending"
    ) {
      return res.status(400).send(
        "Only pending appointments can be approved"
      );
    }

    // ----------------------------------------
    // Approve
    // ----------------------------------------

    appointment.status =
      "Approved";

    await appointment.save();
    await notify({ app: req.app, user: appointment.patient, type: "appointment_confirmed", title: "Appointment Confirmed", message: `Dr. ${req.user.fullName || req.user.firstName} confirmed your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} at ${appointment.appointmentTime}.`, link: `/patient/appointments/${appointment._id}`, eventKey: `appointment-confirmed:${appointment._id}` });

    return res.redirect(
      "/doctor/appointments"
    );
  } catch (error) {
    console.error(
      "Approve Appointment Error:",
      error
    );

    return res.status(500).send(
      "Unable to approve appointment"
    );
  }
};

// Reject is deliberately separate from cancellation: it is available only while pending.
exports.rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!appointment) return res.status(404).send("Appointment not found");
    if (appointment.status !== "Pending") return res.status(400).send("Only pending appointments can be rejected");
    appointment.status = "Rejected";
    await appointment.save();
    await notify({ app: req.app, user: appointment.patient, type: "appointment_rejected", title: "Appointment Rejected", message: `Dr. ${req.user.fullName || req.user.firstName} was unable to accept your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString("en-IN")}.`, link: `/patient/appointments/${appointment._id}`, eventKey: `appointment-rejected:${appointment._id}` });
    return res.redirect("/doctor/appointments");
  } catch (error) {
    console.error("Reject Appointment Error:", error);
    return res.status(500).send("Unable to reject appointment");
  }
};

// ==========================================
// CANCEL APPOINTMENT
// ==========================================

exports.cancelAppointment = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.user._id;

    const appointmentId =
      req.params.id;

    // ----------------------------------------
    // Find appointment
    // ----------------------------------------

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,

        doctor: doctorId,
      });

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ----------------------------------------
    // Cannot cancel completed/cancelled
    // ----------------------------------------

    if (
      appointment.status ===
        "Completed" ||
      appointment.status ===
        "Cancelled"
    ) {
      return res.status(400).send(
        "This appointment cannot be cancelled"
      );
    }

    // ----------------------------------------
    // Cancel
    // ----------------------------------------

    appointment.status =
      "Cancelled";

    await appointment.save();
    await notify({ app: req.app, user: appointment.patient, type: "appointment_cancelled_by_doctor", title: "Appointment Cancelled", message: `Dr. ${req.user.fullName || req.user.firstName} cancelled your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString("en-IN")}.`, link: `/patient/appointments/${appointment._id}`, eventKey: `appointment-cancelled-by-doctor:${appointment._id}` });

    return res.redirect(
      "/doctor/appointments"
    );
  } catch (error) {
    console.error(
      "Cancel Appointment Error:",
      error
    );

    return res.status(500).send(
      "Unable to cancel appointment"
    );
  }
};

// ==========================================
// COMPLETE APPOINTMENT
// ==========================================

exports.completeAppointment = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.user._id;

    const appointmentId =
      req.params.id;

    // ----------------------------------------
    // Find appointment
    // ----------------------------------------

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,

        doctor: doctorId,
      });

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ----------------------------------------
    // Only approved appointment
    // ----------------------------------------

    if (
      appointment.status !==
      "Approved"
    ) {
      return res.status(400).send(
        "Only approved appointments can be completed"
      );
    }

    // ----------------------------------------
    // Complete
    // ----------------------------------------

    appointment.status =
      "Completed";

    await appointment.save();
    await notify({ app: req.app, user: appointment.patient, type: "appointment_completed", title: "Appointment Completed", message: `Your appointment with Dr. ${req.user.fullName || req.user.firstName} has been completed.`, link: `/patient/appointments/${appointment._id}`, eventKey: `appointment-completed:${appointment._id}` });

    return res.redirect(
      "/doctor/appointments"
    );
  } catch (error) {
    console.error(
      "Complete Appointment Error:",
      error
    );

    return res.status(500).send(
      "Unable to complete appointment"
    );
  }
};


// ==================================================
// MEDICAL RECORD
// ==================================================

// ==========================================
// GET ADD MEDICAL RECORD PAGE
// ==========================================

exports.getAddMedicalRecord = async (
  req,
  res
) => {
  try {
    // ----------------------------------------
    // Find appointment
    // ----------------------------------------

    const appointment =
      await Appointment.findOne({
        _id: req.params.id,

        doctor: req.user._id,
      }).populate(
        "patient",
        "firstName lastName email phone profileImage"
      );

    // ----------------------------------------
    // Appointment not found
    // ----------------------------------------

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ----------------------------------------
    // Only approved appointment
    // ----------------------------------------

    if (
      appointment.status !==
      "Approved"
    ) {
      return res.status(400).send(
        "Medical record can only be added to an approved appointment"
      );
    }

    // ----------------------------------------
    // Check existing record
    // ----------------------------------------

    const existingRecord =
      await MedicalHistory.findOne({
        appointment:
          appointment._id,

        doctor:
          req.user._id,
      }).lean();

    // ----------------------------------------
    // Render form
    // ----------------------------------------

    return res.render(
      "doctor/appointments/medicalRecord",
      {
        title:
          "Add Medical Record",

        user: req.user,

        appointment,

        medicalRecord:
          existingRecord,
      }
    );
  } catch (error) {
    console.error(
      "Get Add Medical Record Error:",
      error
    );

    return res.status(500).send(
      "Unable to load medical record form"
    );
  }
};

// ==========================================
// SAVE MEDICAL RECORD
// ==========================================

exports.addMedicalRecord = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.user._id;

    const appointmentId =
      req.params.id;

    const {
      diagnosis,
      symptoms,
      treatment,
      medicines,
      notes,
      visitDate,
    } = req.body;

    // ========================================
    // FIND APPOINTMENT
    // ========================================

    const appointment =
      await Appointment.findOne({
        _id: appointmentId,

        doctor: doctorId,
      });

    if (!appointment) {
      return res.status(404).send(
        "Appointment not found"
      );
    }

    // ========================================
    // ONLY APPROVED APPOINTMENT
    // ========================================

    if (
      appointment.status !==
      "Approved"
    ) {
      return res.status(400).send(
        "Only approved appointments can have a medical record"
      );
    }

    // ========================================
    // DIAGNOSIS REQUIRED
    // ========================================

    if (
      !diagnosis ||
      !diagnosis.trim()
    ) {
      return res.status(400).send(
        "Diagnosis is required"
      );
    }

    // ========================================
    // VALIDATE VISIT DATE
    // ========================================

    let finalVisitDate =
      new Date();

    if (visitDate) {
      const parsedVisitDate =
        new Date(visitDate);

      if (
        isNaN(
          parsedVisitDate.getTime()
        )
      ) {
        return res.status(400).send(
          "Invalid visit date"
        );
      }

      finalVisitDate =
        parsedVisitDate;
    }

    // ========================================
    // CHECK EXISTING RECORD
    // ========================================

    const existingRecord =
      await MedicalHistory.findOne({
        appointment:
          appointment._id,
      });

    if (existingRecord) {
      return res.status(400).send(
        "Medical record already exists for this appointment"
      );
    }

    // ========================================
    // CREATE MEDICAL HISTORY
    // ========================================

    const medicalHistory =
      new MedicalHistory({
        patient:
          appointment.patient,

        doctor:
          doctorId,

        appointment:
          appointment._id,

        diagnosis:
          diagnosis.trim(),

        symptoms:
          symptoms
            ? symptoms.trim()
            : "",

        treatment:
          treatment
            ? treatment.trim()
            : "",

        medicines:
          medicines
            ? medicines.trim()
            : "",

        notes:
          notes
            ? notes.trim()
            : "",

        visitDate:
          finalVisitDate,
      });

    // ========================================
    // SAVE MEDICAL RECORD
    // ========================================

    await medicalHistory.save();
    await notify({ app: req.app, user: appointment.patient, type: "medical_record_updated", title: "Medical Record Updated", message: `Your medical record has been updated by Dr. ${req.user.fullName || req.user.firstName}.`, link: "/patient/history", eventKey: `medical-record:${medicalHistory._id}` });

    // ========================================
    // COMPLETE APPOINTMENT
    // ========================================

    appointment.status =
      "Completed";

    await appointment.save();

    // ========================================
    // REDIRECT
    // ========================================

    return res.redirect(
      `/doctor/appointments/${appointment._id}`
    );
  } catch (error) {
    console.error(
      "Add Medical Record Error:",
      error
    );

    return res.status(500).send(
      "Unable to save medical record"
    );
  }
};

// ============================================================
// DOCTOR -> PATIENT MODULE
// MediCore
// ============================================================


// ============================================================
// GET ALL PATIENTS
// GET /doctor/patients
// ============================================================

exports.getPatients = async (req, res) => {
    try {

        const doctorId = req.user._id;

        // ----------------------------------------------------
        // Get all non-cancelled appointments of this doctor
        // ----------------------------------------------------

        const appointments = await Appointment.find({
            doctor: doctorId,
            status: { $ne: "Cancelled" }
        })
            .populate(
                "patient",
                "firstName lastName email phone profileImage"
            )
            .sort({
                appointmentDate: -1,
                appointmentTime: -1
            });


        // ----------------------------------------------------
        // Create unique patient list
        // ----------------------------------------------------

        const patientMap = new Map();


        appointments.forEach((appointment) => {

            if (!appointment.patient) {
                return;
            }

            const patient = appointment.patient;

            const patientId = patient._id.toString();


            if (!patientMap.has(patientId)) {

                patientMap.set(patientId, {

                    patient,

                    totalAppointments: 0,

                    lastAppointment: null,

                    lastAppointmentDate: null,

                    status: "Active"

                });

            }


            const patientData = patientMap.get(patientId);

            patientData.totalAppointments++;


            // Since appointments are already sorted newest first,
            // first appointment becomes the latest appointment.

            if (!patientData.lastAppointment) {

                patientData.lastAppointment = appointment;

                patientData.lastAppointmentDate =
                    appointment.appointmentDate;

            }

        });


        const patients = Array.from(
            patientMap.values()
        );


        // ----------------------------------------------------
        // Render patient list
        // ----------------------------------------------------

        res.render(
            "doctor/patients/patients",
            {
                title: "My Patients",

                user: req.user,

                patients
            }
        );


    } catch (error) {

        console.error(
            "Get Patients Error:",
            error
        );

        res.status(500).send(
            "Unable to load patients"
        );

    }
};



// ============================================================
// GET PATIENT DETAILS
// GET /doctor/patients/:id
// ============================================================

exports.getPatientDetails = async (req, res) => {
    try {

        const doctorId = req.user._id;

        const patientId = req.params.id;


        // ----------------------------------------------------
        // Verify patient has an appointment with this doctor
        // ----------------------------------------------------

        const patientAppointment =
            await Appointment.findOne({
                doctor: doctorId,
                patient: patientId
            })
                .populate(
                    "patient",
                    "firstName lastName email phone profileImage"
                );


        if (!patientAppointment || !patientAppointment.patient) {

            return res.status(404).send(
                "Patient not found"
            );

        }


        const patient =
            patientAppointment.patient;


        // ----------------------------------------------------
        // Get patient's appointments with this doctor
        // ----------------------------------------------------

        const appointments =
            await Appointment.find({
                doctor: doctorId,
                patient: patientId
            })
                .sort({
                    appointmentDate: -1,
                    appointmentTime: -1
                });


        // ----------------------------------------------------
        // Get medical history of this patient with this doctor
        // ----------------------------------------------------

        const medicalHistory =
            await MedicalHistory.find({
                doctor: doctorId,
                patient: patientId
            })
                .populate(
                    "appointment",
                    "department appointmentDate appointmentTime status"
                )
                .sort({
                    visitDate: -1,
                    createdAt: -1
                });


        // ----------------------------------------------------
        // Appointment statistics
        // ----------------------------------------------------

        const totalAppointments =
            appointments.length;


        const completedAppointments =
            appointments.filter(
                (appointment) =>
                    appointment.status === "Completed"
            ).length;


        const pendingAppointments =
            appointments.filter(
                (appointment) =>
                    appointment.status === "Pending"
            ).length;


        const approvedAppointments =
            appointments.filter(
                (appointment) =>
                    appointment.status === "Approved"
            ).length;


        // ----------------------------------------------------
        // Last appointment
        // ----------------------------------------------------

        const lastAppointment =
            appointments.length > 0
                ? appointments[0]
                : null;


        // ----------------------------------------------------
        // Render
        // ----------------------------------------------------

        res.render(
            "doctor/patients/details",
            {
                title: "Patient Details",

                user: req.user,

                patient,

                appointments,

                medicalHistory,

                stats: {

                    totalAppointments,

                    completedAppointments,

                    pendingAppointments,

                    approvedAppointments

                },

                lastAppointment
            }
        );


    } catch (error) {

        console.error(
            "Get Patient Details Error:",
            error
        );

        res.status(500).send(
            "Unable to load patient details"
        );

    }
};



// ============================================================
// GET PATIENT APPOINTMENTS
// GET /doctor/patients/:id/appointments
// ============================================================

exports.getPatientAppointments = async (req, res) => {
    try {

        const doctorId = req.user._id;

        const patientId = req.params.id;


        // ----------------------------------------------------
        // Verify patient belongs to this doctor
        // ----------------------------------------------------

        const patient =
            await User.findOne({
                _id: patientId,
                role: "patient"
            });


        if (!patient) {

            return res.status(404).send(
                "Patient not found"
            );

        }


        const doctorAppointment =
            await Appointment.findOne({
                doctor: doctorId,
                patient: patientId
            });


        if (!doctorAppointment) {

            return res.status(403).send(
                "You do not have access to this patient"
            );

        }


        // ----------------------------------------------------
        // Get appointments
        // ----------------------------------------------------

        const appointments =
            await Appointment.find({
                doctor: doctorId,
                patient: patientId
            })
                .sort({
                    appointmentDate: -1,
                    appointmentTime: -1
                });


        // ----------------------------------------------------
        // Render
        // ----------------------------------------------------

        res.render(
            "doctor/patients/appointments",
            {
                title: "Patient Appointments",

                user: req.user,

                patient,

                appointments
            }
        );


    } catch (error) {

        console.error(
            "Get Patient Appointments Error:",
            error
        );

        res.status(500).send(
            "Unable to load patient appointments"
        );

    }
};



// ============================================================
// GET PATIENT MEDICAL HISTORY
// GET /doctor/patients/:id/medical-history
// ============================================================

exports.getPatientMedicalHistory = async (req, res) => {
    try {

        const doctorId = req.user._id;

        const patientId = req.params.id;


        // ----------------------------------------------------
        // Verify patient
        // ----------------------------------------------------

        const patient =
            await User.findOne({
                _id: patientId,
                role: "patient"
            });


        if (!patient) {

            return res.status(404).send(
                "Patient not found"
            );

        }


        // ----------------------------------------------------
        // Verify doctor-patient relationship
        // ----------------------------------------------------

        const doctorAppointment =
            await Appointment.findOne({
                doctor: doctorId,
                patient: patientId
            });


        if (!doctorAppointment) {

            return res.status(403).send(
                "You do not have access to this patient"
            );

        }


        // ----------------------------------------------------
        // Get medical history
        // ----------------------------------------------------

        const medicalHistory =
            await MedicalHistory.find({
                doctor: doctorId,
                patient: patientId
            })
                .populate(
                    "appointment",
                    "department appointmentDate appointmentTime status"
                )
                .sort({
                    visitDate: -1,
                    createdAt: -1
                });


        // ----------------------------------------------------
        // Render
        // ----------------------------------------------------

        res.render(
            "doctor/patients/medical-history",
            {
                title: "Patient Medical History",

                user: req.user,

                patient,

                medicalHistory
            }
        );


    } catch (error) {

        console.error(
            "Get Patient Medical History Error:",
            error
        );

        res.status(500).send(
            "Unable to load patient medical history"
        );

    }
};

exports.getPatientDetails = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const patientId = req.params.id;

        const patient = await User.findOne({
            _id: patientId,
            role: "patient"
        }).select(
            "firstName lastName email phone profileImage"
        );

        if (!patient) {
            return res.status(404).send("Patient not found");
        }

        const appointments = await Appointment.find({
            doctor: doctorId,
            patient: patientId
        })
        .sort({ appointmentDate: -1 })
        .lean();

        if (!appointments.length) {
            return res.status(403).send(
                "You do not have access to this patient"
            );
        }

        const medicalHistory = await MedicalHistory.find({
            doctor: doctorId,
            patient: patientId
        })
        .populate(
            "appointment",
            "appointmentDate appointmentTime department status"
        )
        .sort({ visitDate: -1 })
        .lean();

        const stats = {
            total: appointments.length,

            completed: appointments.filter(
                a => a.status === "Completed"
            ).length,

            pending: appointments.filter(
                a => a.status === "Pending"
            ).length,

            approved: appointments.filter(
                a => a.status === "Approved"
            ).length
        };

        const lastAppointment = appointments[0] || null;

        res.render("doctor/patients/details", {
            title: "Patient Details",
            user: req.user,
            patient,
            appointments,
            medicalHistory,
            stats,
            lastAppointment
        });

    } catch (error) {

        console.error("Get Patient Details Error:", error);

        res.status(500).send("Server Error");
    }
};

exports.getPatientAppointments = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const patientId = req.params.id;

        const patient = await User.findOne({
            _id: patientId,
            role: "patient"
        }).select(
            "firstName lastName email phone profileImage"
        );

        if (!patient) {
            return res.status(404).send("Patient not found");
        }

        const appointments = await Appointment.find({
            doctor: doctorId,
            patient: patientId
        })
        .sort({ appointmentDate: -1 })
        .lean();

        if (!appointments.length) {
            return res.status(403).send(
                "You do not have access to this patient"
            );
        }

        res.render("doctor/patients/appointments", {
            title: "Patient Appointments",
            user: req.user,
            patient,
            appointments
        });

    } catch (error) {

        console.error(
            "Get Patient Appointments Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};
// ============================================================
// DOCTOR - PRESCRIPTIONS
// ============================================================

// GET ALL PRESCRIPTIONS
exports.getPrescriptions = async (req, res) => {
    try {
        const doctorId = req.user._id;

        const prescriptions = await Prescription.find({
            doctor: doctorId
        })
        .populate(
            "patient",
            "firstName lastName email phone profileImage"
        )
        .sort({
            createdAt: -1
        })
        .lean();

        res.render("doctor/prescriptions/prescriptions", {
            title: "Prescriptions",
            user: req.user,
            prescriptions
        });

    } catch (error) {
        console.error("Get Prescriptions Error:", error);

        res.status(500).send("Server Error");
    }
};


// GET CREATE PRESCRIPTION PAGE
exports.getCreatePrescription = async (req, res) => {
    try {
        const doctorId = req.user._id;

        // Only patients who have an appointment with this doctor
        const appointments = await Appointment.find({
            doctor: doctorId
        })
        .populate(
            "patient",
            "firstName lastName email phone"
        )
        .sort({
            appointmentDate: -1
        })
        .lean();

        // Remove duplicate patients
        const patientMap = new Map();

        appointments.forEach(appointment => {

            if (
                appointment.patient &&
                !patientMap.has(
                    appointment.patient._id.toString()
                )
            ) {
                patientMap.set(
                    appointment.patient._id.toString(),
                    appointment.patient
                );
            }

        });

        const patients = Array.from(patientMap.values());

        res.render("doctor/prescriptions/create", {
            title: "Create Prescription",
            user: req.user,
            patients
        });

    } catch (error) {
        console.error(
            "Get Create Prescription Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// CREATE PRESCRIPTION
exports.createPrescription = async (req, res) => {
    try {

        const doctorId = req.user._id;

        const {
            patient,
            medicine,
            dosage,
            notes
        } = req.body;

        // Validation
        if (!patient) {
            return res.status(400).send(
                "Please select a patient"
            );
        }

        if (!medicine || !medicine.trim()) {
            return res.status(400).send(
                "Medicine is required"
            );
        }

        if (!dosage || !dosage.trim()) {
            return res.status(400).send(
                "Dosage is required"
            );
        }

        // Check patient
        const patientExists = await User.findOne({
            _id: patient,
            role: "patient"
        });

        if (!patientExists) {
            return res.status(404).send(
                "Patient not found"
            );
        }

        // Check doctor-patient relationship
        const hasAppointment = await Appointment.exists({
            doctor: doctorId,
            patient: patient
        });

        if (!hasAppointment) {
            return res.status(403).send(
                "You can prescribe only to your patients"
            );
        }

        const prescription = await Prescription.create({
            patient,
            doctor: doctorId,
            medicine: medicine.trim(),
            dosage: dosage.trim(),
            notes: notes
                ? notes.trim()
                : ""
        });
        await notify({ app: req.app, user: patient, type: "prescription_uploaded", title: "New Prescription Available", message: `Dr. ${req.user.fullName || req.user.firstName} has added a new prescription to your MediCore account.`, link: "/patient/prescriptions", eventKey: `prescription:${prescription._id}` });

        res.redirect("/doctor/prescriptions");

    } catch (error) {

        console.error(
            "Create Prescription Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// GET PRESCRIPTION DETAILS
exports.getPrescriptionDetails = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const prescriptionId = req.params.id;

        const prescription =
            await Prescription.findOne({
                _id: prescriptionId,
                doctor: doctorId
            })
            .populate(
                "patient",
                "firstName lastName email phone profileImage"
            )
            .lean();

        if (!prescription) {
            return res.status(404).send(
                "Prescription not found"
            );
        }

        res.render(
            "doctor/prescriptions/details",
            {
                title: "Prescription Details",
                user: req.user,
                prescription
            }
        );

    } catch (error) {

        console.error(
            "Get Prescription Details Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// DELETE PRESCRIPTION
exports.deletePrescription = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const prescriptionId = req.params.id;

        const prescription =
            await Prescription.findOneAndDelete({
                _id: prescriptionId,
                doctor: doctorId
            });

        if (!prescription) {
            return res.status(404).send(
                "Prescription not found"
            );
        }

        res.redirect("/doctor/prescriptions");

    } catch (error) {

        console.error(
            "Delete Prescription Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};

// ============================================================
// DOCTOR - REPORTS
// ============================================================


// GET ALL REPORTS
exports.getReports = async (req, res) => {
    try {

        const doctorId = req.user._id;

        // Get patients who have appointments with this doctor
        const appointments = await Appointment.find({
            doctor: doctorId
        })
        .select("patient")
        .lean();

        const patientIds = [
            ...new Set(
                appointments
                    .filter(a => a.patient)
                    .map(a => a.patient.toString())
            )
        ];

        if (patientIds.length === 0) {
            return res.render("doctor/reports/reports", {
                title: "Reports",
                user: req.user,
                reports: []
            });
        }

        const reports = await Report.find({
            patient: {
                $in: patientIds
            }
        })
        .populate(
            "patient",
            "firstName lastName email phone profileImage"
        )
        .sort({
            reportDate: -1,
            createdAt: -1
        })
        .lean();

        res.render("doctor/reports/reports", {
            title: "Reports",
            user: req.user,
            reports
        });

    } catch (error) {

        console.error(
            "Get Doctor Reports Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// GET CREATE REPORT PAGE
exports.getCreateReport = async (req, res) => {
    try {

        const doctorId = req.user._id;

        const appointments = await Appointment.find({
            doctor: doctorId
        })
        .populate(
            "patient",
            "firstName lastName email phone"
        )
        .sort({
            appointmentDate: -1
        })
        .lean();

        // Remove duplicate patients
        const patientMap = new Map();

        appointments.forEach(appointment => {

            if (
                appointment.patient &&
                !patientMap.has(
                    appointment.patient._id.toString()
                )
            ) {
                patientMap.set(
                    appointment.patient._id.toString(),
                    appointment.patient
                );
            }

        });

        const patients = Array.from(
            patientMap.values()
        );

        res.render("doctor/reports/create", {
            title: "Create Report",
            user: req.user,
            patients
        });

    } catch (error) {

        console.error(
            "Get Create Report Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// ============================================================
// CREATE REPORT
// ============================================================

exports.createReport = async (req, res) => {

    try {

        const doctorId = req.user._id;

        // ====================================================
        // SAFETY CHECK
        // ====================================================

        if (!req.body) {

            if (req.file) {

                try {
                    fs.unlinkSync(
                        req.file.path
                    );
                } catch (fileError) {
                    console.error(
                        "Uploaded file cleanup error:",
                        fileError
                    );
                }

            }

            return res.status(400).send(
                "No report data received."
            );
        }


        // ====================================================
        // GET FORM DATA
        // ====================================================

        const {
            patient,
            title,
            reportDate
        } = req.body;


        // ====================================================
        // VALIDATION
        // ====================================================

        if (!patient) {

            return res.status(400).send(
                "Please select a patient."
            );

        }


        if (!title || !title.trim()) {

            return res.status(400).send(
                "Report title is required."
            );

        }


        // ====================================================
        // CHECK PATIENT
        // ====================================================

        const patientExists =
            await User.findOne({

                _id: patient,

                role: "patient"

            });


        if (!patientExists) {

            return res.status(404).send(
                "Patient not found."
            );

        }


        // ====================================================
        // CHECK DOCTOR-PATIENT RELATIONSHIP
        // ====================================================

        const hasAppointment =
            await Appointment.exists({

                doctor: doctorId,

                patient: patient

            });


        if (!hasAppointment) {

            return res.status(403).send(
                "You can create reports only for your patients."
            );

        }


        // ====================================================
        // FILE
        // ====================================================

        let filePath = "";

        if (req.file) {

            filePath =
                "/uploads/reports/" +
                req.file.filename;

        }


        // ====================================================
        // REPORT DATE
        // ====================================================

        let finalReportDate =
            new Date();


        if (reportDate) {

            const parsedDate =
                new Date(reportDate);

            if (
                isNaN(
                    parsedDate.getTime()
                )
            ) {

                if (req.file) {

                    try {
                        fs.unlinkSync(
                            req.file.path
                        );
                    } catch (fileError) {
                        console.error(
                            "File cleanup error:",
                            fileError
                        );
                    }

                }

                return res.status(400).send(
                    "Invalid report date."
                );
            }

            finalReportDate =
                parsedDate;
        }


        // ====================================================
        // CREATE REPORT
        // ====================================================

        const report =
            await Report.create({

                patient,

                title:
                    title.trim(),

                file:
                    filePath,

                reportDate:
                    finalReportDate

            });
        await notify({ app: req.app, user: patient, type: "report_uploaded", title: "New Medical Report Available", message: `Dr. ${req.user.fullName || req.user.firstName} has uploaded a new medical report to your MediCore account.`, link: "/patient/reports", eventKey: `report:${report._id}` });


        // ====================================================
        // REDIRECT
        // ====================================================

        return res.redirect(
            `/doctor/reports/${report._id}`
        );


    } catch (error) {

        console.error(
            "Create Report Error:",
            error
        );


        // ====================================================
        // DELETE UPLOADED FILE IF DATABASE SAVE FAILS
        // ====================================================

        if (req.file) {

            try {

                if (
                    fs.existsSync(
                        req.file.path
                    )
                ) {

                    fs.unlinkSync(
                        req.file.path
                    );

                }

            } catch (fileError) {

                console.error(
                    "Uploaded file cleanup error:",
                    fileError
                );

            }

        }


        // Multer errors
        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).send(
                `Upload Error: ${error.message}`
            );

        }


        return res.status(500).send(
            "Unable to create report."
        );

    }

};

// GET REPORT DETAILS
exports.getReportDetails = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const reportId = req.params.id;

        const report = await Report.findById(
            reportId
        )
        .populate(
            "patient",
            "firstName lastName email phone profileImage"
        )
        .lean();

        if (!report) {
            return res.status(404).send(
                "Report not found"
            );
        }

        // Verify doctor-patient relationship
        const hasAppointment = await Appointment.exists({
            doctor: doctorId,
            patient: report.patient._id
        });

        if (!hasAppointment) {
            return res.status(403).send(
                "You do not have access to this report"
            );
        }

        res.render(
            "doctor/reports/details",
            {
                title: "Report Details",
                user: req.user,
                report
            }
        );

    } catch (error) {

        console.error(
            "Get Report Details Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};


// DELETE REPORT
exports.deleteReport = async (req, res) => {
    try {

        const doctorId = req.user._id;
        const reportId = req.params.id;

        const report = await Report.findById(
            reportId
        );

        if (!report) {
            return res.status(404).send(
                "Report not found"
            );
        }

        // Verify access
        const hasAppointment = await Appointment.exists({
            doctor: doctorId,
            patient: report.patient
        });

        if (!hasAppointment) {
            return res.status(403).send(
                "You cannot delete this report"
            );
        }

        await Report.findByIdAndDelete(
            reportId
        );

        res.redirect(
            "/doctor/reports"
        );

    } catch (error) {

        console.error(
            "Delete Report Error:",
            error
        );

        res.status(500).send("Server Error");
    }
};

// ------------------------------------------------------------
// View Medical Record
// GET /doctor/appointments/:id/medical-record/view
// ------------------------------------------------------------
exports.getMedicalRecord = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctor: req.user._id
        })
        .populate("patient", "firstName lastName email phone profileImage")
        .populate("doctor", "firstName lastName specialization");

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        const medicalRecord = await MedicalHistory.findOne({
            appointment: appointment._id,
            doctor: req.user._id
        });

        if (!medicalRecord) {
            return res.redirect(
                `/doctor/appointments/${appointment._id}/medical-record`
            );
        }

        res.render("doctor/appointments/medicalRecordDetails", {
            title: "Medical Record",
            user: req.user,
            appointment,
            medicalRecord
        });

    } catch (error) {
        console.error("Get Medical Record Error:", error);
        res.status(500).send("Server Error");
    }
};


// ============================================================
// DOCTOR AVAILABILITY
// ============================================================

// ------------------------------------------------------------
// GET Availability Page
// GET /doctor/availability
// ------------------------------------------------------------
exports.getAvailability = async (req, res) => {
    try {
        const doctor = await User.findById(req.user._id);

        if (!doctor) {
            return res.status(404).render("404");
        }

        const days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        const availability = doctor.availability || [];

        res.render("doctor/availability", {
            title: "My Availability",
            user: doctor,
            days,
            availability,
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Get Availability Error:", error);

        return res.status(500).render("error");
    }
};


// ------------------------------------------------------------
// SAVE Availability
// POST /doctor/availability
// ------------------------------------------------------------
exports.saveAvailability = async (req, res) => {
    try {
        const doctor = await User.findById(req.user._id);

        if (!doctor) {
            return res.status(404).render("404");
        }

        const days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        const newAvailability = [];

        days.forEach((day) => {

            const key = day.toLowerCase();

            const enabled = req.body[`${key}_enabled`] === "on";

            const startTime = req.body[`${key}_startTime`] || "";
            const endTime = req.body[`${key}_endTime`] || "";

            if (enabled) {

                if (!startTime || !endTime) {
                    throw new Error(
                        `${day}: Start time and End time are required.`
                    );
                }

                if (startTime >= endTime) {
                    throw new Error(
                        `${day}: End time must be after Start time.`
                    );
                }

                newAvailability.push({
                    day,
                    startTime,
                    endTime,
                    isAvailable: true
                });

            } else {

                newAvailability.push({
                    day,
                    startTime: "",
                    endTime: "",
                    isAvailable: false
                });

            }
        });

        doctor.availability = newAvailability;

        await doctor.save();

        return res.redirect(
            "/doctor/availability?success=Availability%20updated%20successfully"
        );

    } catch (error) {

        console.error(
            "Save Availability Error:",
            error
        );

        const doctor = await User.findById(req.user._id);

        return res.status(400).render(
            "doctor/availability",
            {
                title: "My Availability",
                user: doctor,
                days: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                ],
                availability: doctor?.availability || [],
                error: error.message,
                success: null
            }
        );
    }
};

// ============================================================
// DOCTOR EARNINGS
// GET /doctor/earnings
// ============================================================

exports.getEarnings = async (req, res) => {

    try {

        const doctorId =
            req.user._id;

        const now =
            new Date();


        // ========================================================
        // TODAY
        // ========================================================

        const startOfToday =
            new Date(now);

        startOfToday.setHours(
            0,
            0,
            0,
            0
        );

        const endOfToday =
            new Date(startOfToday);

        endOfToday.setDate(
            endOfToday.getDate() + 1
        );


        // ========================================================
        // WEEK
        // Monday - Sunday
        // ========================================================

        const startOfWeek =
            new Date(now);

        startOfWeek.setHours(
            0,
            0,
            0,
            0
        );

        const currentDay =
            startOfWeek.getDay();

        const difference =
            currentDay === 0
                ? 6
                : currentDay - 1;

        startOfWeek.setDate(
            startOfWeek.getDate() -
            difference
        );

        const endOfWeek =
            new Date(startOfWeek);

        endOfWeek.setDate(
            endOfWeek.getDate() + 7
        );


        // ========================================================
        // MONTH
        // ========================================================

        const startOfMonth =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

        const endOfMonth =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            );


        // ========================================================
        // BASE FILTER
        // ========================================================

        const baseFilter = {

            doctor:
                doctorId,

            status:
                "Paid",

            paidAt:
                {
                    $ne: null
                }
        };


        // ========================================================
        // TODAY
        // ========================================================

        const todayResult =
            await Payment.aggregate([

                {
                    $match: {

                        ...baseFilter,

                        paidAt: {

                            $gte:
                                startOfToday,

                            $lt:
                                endOfToday
                        }
                    }
                },

                {
                    $group: {

                        _id:
                            null,

                        total: {

                            $sum:
                                "$amount"
                        },

                        count: {

                            $sum:
                                1
                        }
                    }
                }

            ]);


        // ========================================================
        // WEEK
        // ========================================================

        const weekResult =
            await Payment.aggregate([

                {
                    $match: {

                        ...baseFilter,

                        paidAt: {

                            $gte:
                                startOfWeek,

                            $lt:
                                endOfWeek
                        }
                    }
                },

                {
                    $group: {

                        _id:
                            null,

                        total: {

                            $sum:
                                "$amount"
                        },

                        count: {

                            $sum:
                                1
                        }
                    }
                }

            ]);


        // ========================================================
        // MONTH
        // ========================================================

        const monthResult =
            await Payment.aggregate([

                {
                    $match: {

                        ...baseFilter,

                        paidAt: {

                            $gte:
                                startOfMonth,

                            $lt:
                                endOfMonth
                        }
                    }
                },

                {
                    $group: {

                        _id:
                            null,

                        total: {

                            $sum:
                                "$amount"
                        },

                        count: {

                            $sum:
                                1
                        }
                    }
                }

            ]);


        // ========================================================
        // TOTAL
        // ========================================================

        const totalResult =
            await Payment.aggregate([

                {
                    $match:
                        baseFilter
                },

                {
                    $group: {

                        _id:
                            null,

                        total: {

                            $sum:
                                "$amount"
                        },

                        count: {

                            $sum:
                                1
                        }
                    }
                }

            ]);


        // ========================================================
        // RECENT PAYMENTS
        // ========================================================

        const recentPayments =
            await Payment.find({

                doctor:
                    doctorId,

                status:
                    "Paid"

            })
            .populate(
                "patient",
                "firstName lastName email profileImage"
            )
            .populate(
                "appointment",
                "appointmentDate appointmentTime department status"
            )
            .sort({

                paidAt:
                    -1

            })
            .limit(10)
            .lean();


        // ========================================================
        // LAST 6 MONTHS REVENUE
        // ========================================================

        const monthlyRevenue = [];


        for (
            let i = 5;
            i >= 0;
            i--
        ) {

            const monthDate =
                new Date(

                    now.getFullYear(),

                    now.getMonth() -
                        i,

                    1
                );


            const nextMonthDate =
                new Date(

                    now.getFullYear(),

                    now.getMonth() -
                        i +
                        1,

                    1
                );


            const result =
                await Payment.aggregate([

                    {
                        $match: {

                            ...baseFilter,

                            paidAt: {

                                $gte:
                                    monthDate,

                                $lt:
                                    nextMonthDate
                            }
                        }
                    },

                    {
                        $group: {

                            _id:
                                null,

                            total: {

                                $sum:
                                    "$amount"
                            }
                        }
                    }

                ]);


            monthlyRevenue.push({

                month:
                    monthDate.toLocaleString(
                        "en-IN",
                        {
                            month:
                                "short"
                        }
                    ),

                amount:
                    result[0]?.total || 0
            });
        }


        // ========================================================
        // RENDER EARNINGS PAGE
        // ========================================================

        return res.render(
            "doctor/earnings",
            {

                title:
                    "Earnings",

                user:
                    req.user,

                earnings: {

                    today:
                        todayResult[0]?.total ||
                        0,

                    week:
                        weekResult[0]?.total ||
                        0,

                    month:
                        monthResult[0]?.total ||
                        0,

                    total:
                        totalResult[0]?.total ||
                        0
                },

                counts: {

                    today:
                        todayResult[0]?.count ||
                        0,

                    week:
                        weekResult[0]?.count ||
                        0,

                    month:
                        monthResult[0]?.count ||
                        0,

                    total:
                        totalResult[0]?.count ||
                        0
                },

                recentPayments,

                monthlyRevenue
            }
        );

    } catch (error) {

        console.error(
            "Doctor Earnings Error:",
            error
        );

        return res.status(500).render(
            "error"
        );
    }
};
