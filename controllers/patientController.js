// ==========================================
// PATIENT CONTROLLER
// MediCore - Doctor Appointment System
// ==========================================

const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Report = require("../models/Report");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const MedicalHistory = require("../models/MedicalHistory");
const { notify } = require("../services/notificationService");

const { auditIdentityEvent } =
    require("../utils/identityAudit");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==========================================
// PATIENT DASHBOARD
// ==========================================

exports.dashboard = async (req, res) => {
    try {

        const user = req.user;

        const canAccessProtected =
            user.identityVerified === true &&
            user.identityVerificationStatus === "verified" &&
            user.faceVerificationStatus === "verified" &&
            req.session.identitySessionVerified === true &&
            String(req.session.identitySessionUserId || "") ===
            String(user._id);

        const upcomingAppointments =
            await Appointment.countDocuments({
                patient: user._id,
                appointmentDate: {
                    $gte: new Date()
                },
                status: "Approved"
            });

        const totalDoctors =
            await Appointment.distinct(
                "doctor",
                {
                    patient: user._id
                }
            );

        const reports = canAccessProtected
            ? await Report.countDocuments({
                patient: user._id
            })
            : 0;

        const pendingPayments =
            await Payment.aggregate([
                {
                    $match: {
                        patient: user._id,
                        status: "Pending"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount"
                        }
                    }
                }
            ]);

        const appointment =
            await Appointment.findOne({
                patient: user._id,
                appointmentDate: {
                    $gte: new Date()
                },
                status: "Approved"
            })
            .populate(
                "doctor",
                "firstName lastName specialization profileImage email phone"
            )
            .sort({
                appointmentDate: 1,
                appointmentTime: 1
            });

        const prescriptions = canAccessProtected
            ? await Prescription.find({
                patient: user._id
            })
                .populate(
                    "doctor",
                    "firstName lastName specialization"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5)
            : [];

        const notifications =
            await Notification.find({
                user: user._id
            })
                .sort({
                    createdAt: -1
                })
                .limit(5);

        res.render(
            "patient/dashboard",
            {
                title: "Patient Dashboard",
                user,

                stats: {
                    upcomingAppointments,
                    totalDoctors:
                        totalDoctors.length,
                    reports,
                    pendingPayments:
                        pendingPayments[0]?.total || 0
                },

                appointment,

                doctor:
                    appointment?.doctor || null,

                prescriptions,
                notifications,

                canAccessProtected,

                identityRequired:
                    req.query.identityRequired === "1"
            }
        );

    } catch (error) {

        console.error(
            "Patient Dashboard Error:",
            error
        );

        res.status(500).send(
            "Dashboard Error"
        );
    }
};


// ==========================================
// PROFILE
// ==========================================

exports.profile = async (req, res) => {
    try {

        const user =
            await User.findById(
                req.user._id
            );

        if (!user) {
            return res.redirect(
                "/login"
            );
        }

        res.render(
            "patient/profile",
            {
                user,
                message: null,
                success: null
            }
        );

    } catch (err) {

        console.error(
            "Patient Profile Error:",
            err
        );

        res.status(500).send(
            "Profile Error"
        );
    }
};


// ==========================================
// UPDATE PROFILE
// ==========================================

exports.updateProfile = async (req, res) => {
    try {

        if (!req.body) {
            return res.status(400).render(
                "patient/profile",
                {
                    user: req.user,
                    message: "No data provided",
                    success: null
                }
            );
        }

        let user =
            await User.findById(
                req.user._id
            );

        if (!user) {
            return res.redirect(
                "/login"
            );
        }


        // BASIC INFORMATION

        user.firstName =
            req.body.firstName ||
            user.firstName;

        user.lastName =
            req.body.lastName ||
            user.lastName;

        user.phone =
            req.body.phone ||
            user.phone;

        user.gender =
            req.body.gender ||
            user.gender;

        user.dob =
            req.body.dob ||
            user.dob;


        // MEDICAL INFORMATION

        user.bloodGroup =
            req.body.bloodGroup ||
            user.bloodGroup;

        user.height =
            req.body.height ||
            user.height;

        user.weight =
            req.body.weight ||
            user.weight;

        user.allergies =
            req.body.allergies ||
            user.allergies;

        user.medicalConditions =
            req.body.medicalConditions ||
            user.medicalConditions;


        // ADDRESS

        user.address =
            req.body.address ||
            user.address;

        user.city =
            req.body.city ||
            user.city;

        user.state =
            req.body.state ||
            user.state;

        user.country =
            req.body.country ||
            user.country;

        user.pincode =
            req.body.pincode ||
            user.pincode;


        // EMERGENCY CONTACT

        user.emergencyContact =
            req.body.emergencyContact ||
            user.emergencyContact;

        user.emergencyPhone =
            req.body.emergencyPhone ||
            user.emergencyPhone;


        // INSURANCE

        user.insuranceProvider =
            req.body.insuranceProvider ||
            user.insuranceProvider;

        user.insuranceNumber =
            req.body.insuranceNumber ||
            user.insuranceNumber;

        user.insuranceExpiry =
            req.body.insuranceExpiry ||
            user.insuranceExpiry;


        // PROFILE IMAGE

        if (req.file) {
            user.profileImage =
                "/uploads/profiles/" +
                req.file.filename;
        }


        await user.save();


        const updatedUser =
            await User.findById(
                user._id
            );

        req.user =
            updatedUser;


        res.render(
            "patient/profile",
            {
                user: updatedUser,
                success:
                    "Profile updated successfully!",
                message: null
            }
        );

    } catch (err) {

        console.error(
            "Profile Update Error:",
            err
        );

        res.render(
            "patient/profile",
            {
                user: req.user,
                message:
                    "Error updating profile: " +
                    err.message,
                success: null
            }
        );
    }
};


// ==========================================
// BOOK APPOINTMENT PAGE
// ==========================================

exports.bookAppointmentPage =
    async (req, res) => {

        try {

            const doctors =
                await User.find({
                    role: "doctor"
                })
                    .select(
                        "firstName lastName specialization profileImage"
                    );

            res.render(
                "patient/bookAppointment",
                {
                    title: "Book Appointment",
                    user: req.user,
                    doctors
                }
            );

        } catch (err) {

            console.error(
                "Book Appointment Page Error:",
                err
            );

            res.status(500).send(
                "Book Appointment Error"
            );
        }
    };


// ==========================================
// BOOK APPOINTMENT
// POST /patient/appointments/book
// ==========================================

exports.bookAppointment = async (req, res) => {

    try {

        const {
            doctor,
            department,
            appointmentDate,
            appointmentTime
        } = req.body;


        // VALIDATION

        if (
            !doctor ||
            !department ||
            !appointmentDate ||
            !appointmentTime
        ) {
            return res.status(400).send(
                "All appointment fields are required"
            );
        }

        if (!department.trim()) {
            return res.status(400).send(
                "Department is required"
            );
        }


        // CHECK DOCTOR

        const selectedDoctor =
            await User.findOne({
                _id: doctor,
                role: "doctor"
            });

        if (!selectedDoctor) {
            return res.status(404).send(
                "Doctor not found"
            );
        }


        // PARSE DATE

        const dateParts =
            appointmentDate.split("-");

        if (dateParts.length !== 3) {
            return res.status(400).send(
                "Invalid appointment date format"
            );
        }

        const [
            year,
            month,
            day
        ] = dateParts.map(Number);

        const selectedDate =
            new Date(
                year,
                month - 1,
                day
            );


        // VALIDATE DATE

        if (
            isNaN(selectedDate.getTime()) ||
            selectedDate.getFullYear() !== year ||
            selectedDate.getMonth() !== month - 1 ||
            selectedDate.getDate() !== day
        ) {
            return res.status(400).send(
                "Invalid appointment date"
            );
        }


        // CHECK PAST DATE

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        if (selectedDate < today) {
            return res.status(400).send(
                "Appointment date cannot be in the past"
            );
        }


        // FIND DAY

        const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        const selectedDay =
            dayNames[
                selectedDate.getDay()
            ];


        // CHECK DOCTOR AVAILABILITY

        const availability =
            (selectedDoctor.availability || [])
                .find(
                    slot =>
                        slot.day === selectedDay &&
                        slot.isAvailable === true
                );

        if (!availability) {
            return res.status(400).send(
                `Doctor is not available on ${selectedDay}`
            );
        }


        // VALIDATE TIME

        const timePattern =
            /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timePattern.test(
            appointmentTime
        )) {
            return res.status(400).send(
                "Invalid appointment time"
            );
        }

        if (
            !timePattern.test(
                availability.startTime
            ) ||
            !timePattern.test(
                availability.endTime
            )
        ) {

            console.error(
                "Invalid doctor availability:",
                availability
            );

            return res.status(500).send(
                "Doctor availability is incorrectly configured"
            );
        }


        // CONVERT TIME

        const [
            appointmentHour,
            appointmentMinute
        ] =
            appointmentTime
                .split(":")
                .map(Number);

        const [
            startHour,
            startMinute
        ] =
            availability.startTime
                .split(":")
                .map(Number);

        const [
            endHour,
            endMinute
        ] =
            availability.endTime
                .split(":")
                .map(Number);


        const appointmentMinutes =
            appointmentHour * 60 +
            appointmentMinute;

        const startMinutes =
            startHour * 60 +
            startMinute;

        const endMinutes =
            endHour * 60 +
            endMinute;


        // VALIDATE AVAILABILITY

        if (
            startMinutes >= endMinutes
        ) {
            return res.status(400).send(
                "Doctor availability time is invalid"
            );
        }

        if (
            appointmentMinutes < startMinutes ||
            appointmentMinutes >= endMinutes
        ) {
            return res.status(400).send(
                `Doctor is available on ${selectedDay} from ${availability.startTime} to ${availability.endTime}`
            );
        }


        // ONLY 30 MINUTE SLOTS

        const slotDifference =
            appointmentMinutes -
            startMinutes;

        if (
            slotDifference % 30 !== 0
        ) {
            return res.status(400).send(
                "Invalid appointment slot. Please select a valid 30-minute slot."
            );
        }


        // DAY RANGE

        const startOfDay =
            new Date(selectedDate);

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        const nextDay =
            new Date(startOfDay);

        nextDay.setDate(
            nextDay.getDate() + 1
        );


        // DOCTOR DOUBLE BOOKING

        const existingDoctorAppointment =
            await Appointment.findOne({
                doctor:
                    selectedDoctor._id,

                appointmentDate: {
                    $gte: startOfDay,
                    $lt: nextDay
                },

                appointmentTime,

                status: {
                    $ne: "Cancelled"
                }
            });

        if (existingDoctorAppointment) {
            return res.status(400).send(
                "This appointment time is already booked. Please choose another time."
            );
        }


        // PATIENT DUPLICATE BOOKING

        const existingPatientAppointment =
            await Appointment.findOne({
                patient:
                    req.user._id,

                doctor:
                    selectedDoctor._id,

                appointmentDate: {
                    $gte: startOfDay,
                    $lt: nextDay
                },

                appointmentTime,

                status: {
                    $ne: "Cancelled"
                }
            });

        if (existingPatientAppointment) {
            return res.status(400).send(
                "You already have an appointment with this doctor at this time."
            );
        }


        // CREATE APPOINTMENT

        const appointment =
            new Appointment({

                patient:
                    req.user._id,

                doctor:
                    selectedDoctor._id,

                department:
                    department.trim(),

                appointmentDate:
                    selectedDate,

                appointmentTime,

                status: "Pending"

            });


        await appointment.save();

        console.log("[Appointment Notification] Appointment saved; entering doctor notification flow", {
            appointmentId: String(appointment._id),
            doctorId: String(selectedDoctor._id)
        });


        // ==========================================
        // CREATE PAYMENT RECORD
        // ==========================================

        const consultationFee =
            Number(
                selectedDoctor.consultationFee || 0
            );

        const payment =
            new Payment({

                patient:
                    req.user._id,

                doctor:
                    selectedDoctor._id,

                appointment:
                    appointment._id,

                amount:
                    consultationFee,

                status:
                    "Pending"

            });

        await payment.save();


        // ==========================================
        // DOCTOR NOTIFICATION
        // ==========================================

        try {

            await notify({ app: req.app, user: selectedDoctor._id, type: "appointment_request", title: "New Appointment Request",
                message: `${req.user.fullName || req.user.firstName || "A patient"} requested an appointment on ${selectedDate.toLocaleDateString("en-IN")} at ${appointmentTime} (${department.trim()}).`,
                link: `/doctor/appointments/${appointment._id}`, eventKey: `appointment-request:${appointment._id}` });

        } catch (notificationError) {

            console.error(
                "Appointment Notification Error:",
                notificationError
            );
        }


        return res.redirect(
            "/patient/appointments"
        );

    } catch (error) {

        console.error(
            "Book Appointment Error:",
            error
        );

        return res.status(500).send(
            "Unable to book appointment"
        );
    }
};


// ==========================================
// AVAILABLE SLOTS
// ==========================================

exports.getAvailableSlots =
    async (req, res) => {

        try {

            const doctorId = req.query.doctorId || req.query.doctor;
            const { date } = req.query;

            if (
                !doctorId ||
                !date
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Doctor and date are required"
                });
            }

            if (!require("mongoose").isValidObjectId(doctorId)) {
                return res.status(400).json({ success: false, message: "Invalid doctor" });
            }

            const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
            if (!dateMatch) {
                return res.status(400).json({ success: false, message: "Invalid date" });
            }


            const doctor =
                await User.findOne({
                    _id: doctorId,
                    role: "doctor"
                });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Doctor not found"
                });
            }


            const selectedDate = new Date(
                Number(dateMatch[1]),
                Number(dateMatch[2]) - 1,
                Number(dateMatch[3])
            );

            if (
                isNaN(selectedDate.getTime()) ||
                selectedDate.getFullYear() !== Number(dateMatch[1]) ||
                selectedDate.getMonth() !== Number(dateMatch[2]) - 1 ||
                selectedDate.getDate() !== Number(dateMatch[3])
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid date"
                });
            }


            const dayNames = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];

            const selectedDay =
                dayNames[
                    selectedDate.getDay()
                ];


            const availability =
                (doctor.availability || [])
                    .find(
                        slot =>
                            slot.day === selectedDay &&
                            slot.isAvailable === true
                    );


            if (!availability) {
                return res.json({
                    success: true,
                    slots: []
                });
            }


            const slots = [];

            const [
                startHour,
                startMinute
            ] =
                availability.startTime
                    .split(":")
                    .map(Number);

            const [
                endHour,
                endMinute
            ] =
                availability.endTime
                    .split(":")
                    .map(Number);


            let currentMinutes =
                startHour * 60 +
                startMinute;

            const endMinutes =
                endHour * 60 +
                endMinute;


            while (
                currentMinutes < endMinutes
            ) {

                const hour =
                    Math.floor(
                        currentMinutes / 60
                    );

                const minute =
                    currentMinutes % 60;

                const time =
                    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;


                const appointmentDate =
                    new Date(selectedDate);

                appointmentDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                const nextDate =
                    new Date(
                        appointmentDate
                    );

                nextDate.setDate(
                    nextDate.getDate() + 1
                );


                const booked =
                    await Appointment.findOne({
                        doctor:
                            doctor._id,

                        appointmentDate: {
                            $gte:
                                appointmentDate,
                            $lt:
                                nextDate
                        },

                        appointmentTime:
                            time,

                        status: {
                            $ne: "Cancelled"
                        }
                    });


                if (!booked) {
                    slots.push(time);
                }


                currentMinutes += 30;
            }


            return res.json({
                success: true,
                available: true,
                day: selectedDay,
                startTime: availability.startTime,
                endTime: availability.endTime,
                slots
            });

        } catch (error) {

            console.error(
                "Get Available Slots Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to fetch available slots"
            });
        }
    };


// ==========================================
// MY APPOINTMENTS
// ==========================================

exports.myAppointments =
    async (req, res) => {

        try {

            const appointments =
                await Appointment.find({
                    patient:
                        req.user._id
                })
                    .populate(
                        "doctor",
                        "firstName lastName specialization profileImage consultationFee"
                    )
                    .sort({
                        appointmentDate: -1,
                        appointmentTime: -1
                    });


            res.render(
                "patient/appointments",
                {
                    title:
                        "My Appointments",

                    user:
                        req.user,

                    appointments
                }
            );

        } catch (error) {

            console.error(
                "My Appointments Error:",
                error
            );

            res.status(500).send(
                "Unable to load appointments"
            );
        }
    };


// ==========================================
// APPOINTMENT DETAILS
// ==========================================

exports.appointmentDetails =
    async (req, res) => {

        try {

            const appointment =
                await Appointment.findOne({
                    _id:
                        req.params.id,

                    patient:
                        req.user._id
                })
                    .populate(
                        "doctor",
                        "firstName lastName specialization profileImage email phone consultationFee"
                    );


            if (!appointment) {
                return res.status(404).send(
                    "Appointment not found"
                );
            }


            const payment =
                await Payment.findOne({
                    appointment:
                        appointment._id,

                    patient:
                        req.user._id
                });


            res.render(
                "patient/appointmentDetails",
                {
                    title:
                        "Appointment Details",

                    user:
                        req.user,

                    appointment,

                    payment
                }
            );

        } catch (error) {

            console.error(
                "Appointment Details Error:",
                error
            );

            res.status(500).send(
                "Unable to load appointment"
            );
        }
    };


// ==========================================
// CANCEL APPOINTMENT
// ==========================================

exports.cancelAppointment =
    async (req, res) => {

        try {

            const appointment =
                await Appointment.findOne({
                    _id:
                        req.params.id,

                    patient:
                        req.user._id
                });


            if (!appointment) {
                return res.status(404).send(
                    "Appointment not found"
                );
            }


            if (
                appointment.status ===
                "Cancelled"
            ) {
                return res.status(400).send(
                    "Appointment is already cancelled"
                );
            }


            appointment.status =
                "Cancelled";


            await appointment.save();

            await notify({ app: req.app, user: appointment.doctor, type: "appointment_cancelled_by_patient", title: "Appointment Cancelled", message: `${req.user.fullName || req.user.firstName || "A patient"} cancelled an appointment on ${new Date(appointment.appointmentDate).toLocaleDateString("en-IN")} at ${appointment.appointmentTime}.`, link: `/doctor/appointments/${appointment._id}`, eventKey: `appointment-cancelled-by-patient:${appointment._id}` });


            // Cancel pending payment

            const payment =
                await Payment.findOne({
                    appointment:
                        appointment._id,

                    patient:
                        req.user._id
                });


            if (
                payment &&
                payment.status === "Pending"
            ) {

                payment.status =
                    "Pending";

                await payment.save();
            }


            return res.redirect(
                "/patient/appointments"
            );

        } catch (error) {

            console.error(
                "Cancel Appointment Error:",
                error
            );

            res.status(500).send(
                "Unable to cancel appointment"
            );
        }
    };

 // ==========================================
// PAYMENT HISTORY
// ==========================================

exports.payments = async (req, res) => {

    try {

        const appointments =
            await Appointment.find({

                patient:
                    req.user._id,

                status:
                    {
                        $ne: "Cancelled"
                    }

            })
            .populate(
                "doctor",
                "firstName lastName specialization profileImage consultationFee"
            )
            .sort({
                appointmentDate: -1,
                appointmentTime: -1
            });


        // ==========================================
        // CREATE / FIX PAYMENT RECORDS
        // ==========================================

        for (
            const appointment
            of appointments
        ) {

            if (!appointment.doctor) {
                continue;
            }


            const consultationFee =
                Number(
                    appointment.doctor.consultationFee || 0
                );


            if (
                !Number.isFinite(
                    consultationFee
                ) ||
                consultationFee <= 0
            ) {
                continue;
            }


            let payment =
                await Payment.findOne({

                    appointment:
                        appointment._id,

                    patient:
                        req.user._id

                });


            // ==========================================
            // CREATE PAYMENT
            // ==========================================

            if (!payment) {

                await Payment.create({

                    patient:
                        req.user._id,

                    doctor:
                        appointment.doctor._id,

                    appointment:
                        appointment._id,

                    amount:
                        consultationFee,

                    status:
                        "Pending"

                });

            }


            // ==========================================
            // FIX OLD ₹0 PAYMENT
            // ==========================================

            else if (
                payment.status === "Pending" &&
                (
                    !payment.amount ||
                    Number(payment.amount) <= 0
                )
            ) {

                payment.amount =
                    consultationFee;

                payment.doctor =
                    appointment.doctor._id;

                await payment.save();
            }
        }


        // ==========================================
        // GET PAYMENT HISTORY
        // ==========================================

        const payments =
            await Payment.find({

                patient:
                    req.user._id

            })
            .populate(
                "doctor",
                "firstName lastName specialization profileImage consultationFee"
            )
            .populate(
                "appointment",
                "appointmentDate appointmentTime department status"
            )
            .sort({
                createdAt: -1
            });


        // ==========================================
        // RENDER
        // ==========================================

        return res.render(
            "patient/payments",
            {
                title:
                    "Payments",

                user:
                    req.user,

                payments
            }
        );


    } catch (error) {

        console.error(
            "Payments Error:",
            error
        );

        return res.status(500).send(
            "Payments Error"
        );
    }
};

// ==========================================
// NOTIFICATIONS
// ==========================================

exports.notifications =
    async (req, res) => {

        try {

            const notifications =
                await Notification.find({
                    user:
                        req.user._id
                })
                    .sort({
                        createdAt: -1
                    });


            res.render(
                "patient/notifications",
                {
                    title:
                        "Notifications",

                    user:
                        req.user,

                    notifications
                }
            );

        } catch (error) {

            console.error(
                "Patient Notifications Error:",
                error
            );

            res.status(500).send(
                "Unable to load notifications"
            );
        }
    };


// ==========================================
// MARK NOTIFICATION READ
// ==========================================

exports.markNotificationRead =
    async (req, res) => {

        try {

            const notification =
                await Notification.findOne({
                    _id:
                        req.params.id,

                    user:
                        req.user._id
                });


            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found"
                });
            }


            notification.isRead =
                true;


            await notification.save();


            return res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "Mark Notification Read Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update notification"
            });
        }
    };


// ==========================================
// SETTINGS
// ==========================================

exports.settings =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            if (!user) {
                return res.redirect(
                    "/login"
                );
            }


            res.render(
                "patient/settings",
                {
                    title:
                        "Settings",

                    user,

                    message: null,
                    success: null
                }
            );

        } catch (error) {

            console.error(
                "Patient Settings Error:",
                error
            );

            res.status(500).send(
                "Unable to load settings"
            );
        }
    };


// ==========================================
// CHANGE PASSWORD
// ==========================================

exports.changePassword =
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;


            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                return res.status(400).send(
                    "All password fields are required"
                );
            }


            if (
                newPassword !==
                confirmPassword
            ) {
                return res.status(400).send(
                    "New passwords do not match"
                );
            }


            if (
                newPassword.length < 6
            ) {
                return res.status(400).send(
                    "Password must be at least 6 characters long"
                );
            }


            const user =
                await User.findById(
                    req.user._id
                );


            if (!user) {
                return res.status(404).send(
                    "User not found"
                );
            }


            const isMatch =
                await user.comparePassword(
                    currentPassword
                );


            if (!isMatch) {
                return res.status(400).send(
                    "Current password is incorrect"
                );
            }


            user.password =
                newPassword;


            await user.save();


            return res.redirect(
                "/patient/settings?success=password"
            );

        } catch (error) {

            console.error(
                "Change Password Error:",
                error
            );

            res.status(500).send(
                "Unable to change password"
            );
        }
    };


// ==========================================
// DELETE ACCOUNT
// ==========================================

exports.deleteAccount =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            if (!user) {
                return res.status(404).send(
                    "User not found"
                );
            }


            await User.findByIdAndDelete(
                req.user._id
            );


            if (req.session) {
                req.session.destroy(
                    () => {
                        res.redirect(
                            "/login"
                        );
                    }
                );
            } else {
                res.redirect(
                    "/login"
                );
            }

        } catch (error) {

            console.error(
                "Delete Account Error:",
                error
            );

            res.status(500).send(
                "Unable to delete account"
            );
        }
    };


// ==========================================
// PRESCRIPTIONS
// ==========================================

exports.prescriptions =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            const canAccessProtected =
                user &&
                user.identityVerified === true &&
                user.identityVerificationStatus ===
                    "verified" &&
                user.faceVerificationStatus ===
                    "verified" &&
                req.session.identitySessionVerified ===
                    true &&
                String(
                    req.session.identitySessionUserId || ""
                ) ===
                    String(user._id);


            if (!canAccessProtected) {

                return res.redirect(
                    "/patient/dashboard?identityRequired=1"
                );
            }


            const prescriptions =
                await Prescription.find({
                    patient:
                        req.user._id
                })
                    .populate(
                        "doctor",
                        "firstName lastName specialization"
                    )
                    .sort({
                        createdAt: -1
                    });


            res.render(
                "patient/prescriptions",
                {
                    title:
                        "My Prescriptions",

                    user,

                    prescriptions
                }
            );

        } catch (error) {

            console.error(
                "Patient Prescriptions Error:",
                error
            );

            res.status(500).send(
                "Unable to load prescriptions"
            );
        }
    };


// ==========================================
// MEDICAL HISTORY
// ==========================================

exports.medicalHistory =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            const canAccessProtected =
                user &&
                user.identityVerified === true &&
                user.identityVerificationStatus ===
                    "verified" &&
                user.faceVerificationStatus ===
                    "verified" &&
                req.session.identitySessionVerified ===
                    true &&
                String(
                    req.session.identitySessionUserId || ""
                ) ===
                    String(user._id);


            if (!canAccessProtected) {

                try {

                    await auditIdentityEvent(
                        req,
                        "MEDICAL_HISTORY_ACCESS_DENIED"
                    );

                } catch (auditError) {

                    console.error(
                        "Identity Audit Error:",
                        auditError
                    );
                }


                return res.redirect(
                    "/patient/dashboard?identityRequired=1"
                );
            }


            const medicalHistory =
                await MedicalHistory.find({
                    patient:
                        req.user._id
                })
                    .populate(
                        "doctor",
                        "firstName lastName specialization"
                    )
                    .sort({
                        createdAt: -1
                    });


            res.render(
                "patient/medicalHistory",
                {
                    title:
                        "Medical History",

                    user,

                    medicalHistory
                }
            );

        } catch (error) {

            console.error(
                "Patient Medical History Error:",
                error
            );

            res.status(500).send(
                "Unable to load medical history"
            );
        }
    };


// ==========================================
// REPORTS
// ==========================================

exports.reports = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        const canAccessProtected =
            user &&
            user.identityVerified === true &&
            user.identityVerificationStatus === "verified" &&
            user.faceVerificationStatus === "verified" &&
            req.session.identitySessionVerified === true &&
            String(req.session.identitySessionUserId || "") ===
                String(user._id);

        if (!canAccessProtected) {

            return res.redirect(
                "/patient/dashboard?identityRequired=1"
            );
        }

        const reports = await Report.find({
            patient: req.user._id
        })
        .sort({
            createdAt: -1
        });

        res.render(
            "patient/reports",
            {
                title: "My Reports",
                user,
                reports
            }
        );

    } catch (error) {

        console.error(
            "Patient Reports Error:",
            error
        );

        res.status(500).send(
            "Unable to load reports"
        );
    }
};

// ==========================================
// UPLOAD REPORT
// ==========================================

exports.uploadReport =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            const canAccessProtected =
                user &&
                user.identityVerified === true &&
                user.identityVerificationStatus ===
                    "verified" &&
                user.faceVerificationStatus ===
                    "verified" &&
                req.session.identitySessionVerified ===
                    true &&
                String(
                    req.session.identitySessionUserId || ""
                ) ===
                    String(user._id);


            if (!canAccessProtected) {

                return res.redirect(
                    "/patient/dashboard?identityRequired=1"
                );
            }


            if (!req.file) {
                return res.status(400).send(
                    "Please select a report file"
                );
            }


            const {
                title,
                reportDate,
                description
            } = req.body;


            if (
                !title ||
                !title.trim()
            ) {
                return res.status(400).send(
                    "Report title is required."
                );
            }


            const report =
                new Report({

                    patient:
                        req.user._id,

                    title:
                        title.trim(),

                    reportDate:
                        reportDate
                            ? new Date(reportDate)
                            : new Date(),

                    description:
                        description
                            ? description.trim()
                            : "",

                    file:
                        req.file.filename

                });


            await report.save();


            return res.redirect(
                "/patient/reports"
            );

        } catch (error) {

            console.error(
                "Upload Report Error:",
                error
            );

            res.status(500).send(
                "Unable to upload report"
            );
        }
    };


// ==========================================
// DOWNLOAD / VIEW REPORT
// ==========================================

exports.downloadReport =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            const canAccessProtected =
                user &&
                user.identityVerified === true &&
                user.identityVerificationStatus ===
                    "verified" &&
                user.faceVerificationStatus ===
                    "verified" &&
                req.session.identitySessionVerified ===
                    true &&
                String(
                    req.session.identitySessionUserId || ""
                ) ===
                    String(user._id);


            if (!canAccessProtected) {

                return res.redirect(
                    "/patient/dashboard?identityRequired=1"
                );
            }


            const report =
                await Report.findOne({

                    _id:
                        req.params.id,

                    patient:
                        req.user._id

                });


            if (!report) {
                return res.status(404).send(
                    "Report not found"
                );
            }


            const path =
                require("path");

            const fs =
                require("fs");


            const filePath =
                path.join(
                    process.cwd(),
                    "uploads",
                    "reports",
                    report.file
                );


            if (
                !fs.existsSync(
                    filePath
                )
            ) {
                return res.status(404).send(
                    "Report file not found"
                );
            }


            res.download(
                filePath,
                report.file
            );

        } catch (error) {

            console.error(
                "Download Report Error:",
                error
            );

            res.status(500).send(
                "Unable to download report"
            );
        }
    };


// ==========================================
// DELETE REPORT
// ==========================================

exports.deleteReport =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            const canAccessProtected =
                user &&
                user.identityVerified === true &&
                user.identityVerificationStatus ===
                    "verified" &&
                user.faceVerificationStatus ===
                    "verified" &&
                req.session.identitySessionVerified ===
                    true &&
                String(
                    req.session.identitySessionUserId || ""
                ) ===
                    String(user._id);


            if (!canAccessProtected) {

                return res.redirect(
                    "/patient/dashboard?identityRequired=1"
                );
            }


            const report =
                await Report.findOne({
                    _id:
                        req.params.id,

                    patient:
                        req.user._id
                });


            if (!report) {
                return res.status(404).send(
                    "Report not found"
                );
            }


            const path =
                require("path");

            const fs =
                require("fs");


            const filePath =
                path.join(
                    process.cwd(),
                    "uploads",
                    "reports",
                    report.file
                );


            if (
                fs.existsSync(
                    filePath
                )
            ) {
                fs.unlinkSync(
                    filePath
                );
            }


            await Report.findByIdAndDelete(
                report._id
            );


            return res.redirect(
                "/patient/reports"
            );

        } catch (error) {

            console.error(
                "Delete Report Error:",
                error
            );

            res.status(500).send(
                "Unable to delete report"
            );
        }
    };


// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// POST /patient/payments/create-order
// ==========================================

// ============================================================
// CREATE RAZORPAY PAYMENT ORDER
// POST /patient/payments/create-order
// ============================================================

exports.createPaymentOrder = async (req, res) => {

    try {

        // ======================================================
        // GET APPOINTMENT ID
        // ======================================================

        const {
            appointmentId
        } = req.body;


        if (!appointmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID is required"

            });
        }


        // ======================================================
        // FIND APPOINTMENT
        // ======================================================
        // Only the logged-in patient can create
        // payment for their own appointment.
        // ======================================================

        const appointment =
            await Appointment.findOne({

                _id:
                    appointmentId,

                patient:
                    req.user._id

            })
            .populate(
                "doctor",
                "firstName lastName specialization profileImage consultationFee email phone"
            );


        // ======================================================
        // APPOINTMENT NOT FOUND
        // ======================================================

        if (!appointment) {

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found"

            });
        }


        // ======================================================
        // CHECK CANCELLED APPOINTMENT
        // ======================================================

        if (
            appointment.status ===
            "Cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Cancelled appointment cannot be paid"

            });
        }


        // ======================================================
        // CHECK DOCTOR
        // ======================================================

        if (!appointment.doctor) {

            return res.status(404).json({

                success: false,

                message:
                    "Doctor information not found"

            });
        }


        // ======================================================
        // GET EXISTING PAYMENT
        // ======================================================

        let payment =
            await Payment.findOne({

                appointment:
                    appointment._id,

                patient:
                    req.user._id

            });


        // ======================================================
        // CHECK IF ALREADY PAID
        // ======================================================

        if (
            payment &&
            payment.status ===
            "Paid"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment has already been completed"

            });
        }


        // ======================================================
        // GET DOCTOR CONSULTATION FEE
        // ======================================================

        let amount =
            Number(
                appointment.doctor
                    .consultationFee || 0
            );


        // ======================================================
        // CHECK DOCTOR FEE
        // ======================================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            // --------------------------------------------------
            // FALLBACK:
            // If doctor profile fee is invalid but an existing
            // pending payment has a valid amount, use that.
            // --------------------------------------------------

            if (
                payment &&
                payment.status === "Pending" &&
                Number(payment.amount) > 0
            ) {

                amount =
                    Number(
                        payment.amount
                    );

            }

        }


        // ======================================================
        // FINAL AMOUNT VALIDATION
        // ======================================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Doctor consultation fee is not configured. Please ask the doctor to set a valid consultation fee."

            });
        }


        // ======================================================
        // ROUND AMOUNT
        // ======================================================
        // Consultation fee should be a valid INR amount.
        // ======================================================

        amount =
            Math.round(
                amount * 100
            ) / 100;


        if (amount <= 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment amount"

            });
        }


        // ======================================================
        // CONVERT INR TO PAISE
        // ======================================================

        const amountInPaise =
            Math.round(
                amount * 100
            );


        // ======================================================
        // RAZORPAY ORDER
        // ======================================================

        const order =
            await razorpay.orders.create({

                amount:
                    amountInPaise,

                currency:
                    "INR",

                receipt:
                    `MEDICORE_${appointment._id}_${Date.now()}`,

                notes: {

                    appointmentId:
                        String(
                            appointment._id
                        ),

                    patientId:
                        String(
                            req.user._id
                        ),

                    doctorId:
                        String(
                            appointment.doctor._id
                        ),

                    doctorName:
                        `${appointment.doctor.firstName || ""} ${appointment.doctor.lastName || ""}`.trim()

                }

            });


        // ======================================================
        // CREATE PAYMENT IF NOT EXISTS
        // ======================================================

        if (!payment) {

            payment =
                new Payment({

                    patient:
                        req.user._id,

                    doctor:
                        appointment.doctor._id,

                    appointment:
                        appointment._id,

                    amount:
                        amount,

                    status:
                        "Pending"

                });

        }


        // ======================================================
        // UPDATE PAYMENT
        // ======================================================

        payment.patient =
            req.user._id;

        payment.doctor =
            appointment.doctor._id;

        payment.appointment =
            appointment._id;

        payment.amount =
            amount;

        payment.status =
            "Pending";


        // ======================================================
        // SAVE RAZORPAY INFORMATION
        // ======================================================

        payment.razorpayOrderId =
            order.id;

        payment.razorpayPaymentId =
            null;

        payment.razorpaySignature =
            null;

        payment.paidAt =
            null;


        // ======================================================
        // SAVE PAYMENT
        // ======================================================

        await payment.save();


        // ======================================================
        // RESPONSE TO FRONTEND
        // ======================================================

        return res.json({

            success: true,


            // --------------------------------------------------
            // RAZORPAY KEY
            // --------------------------------------------------

            key:
                process.env.RAZORPAY_KEY_ID,


            // --------------------------------------------------
            // ORDER INFORMATION
            // --------------------------------------------------

            order: {

                id:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency

            },


            // --------------------------------------------------
            // BACKWARD COMPATIBILITY
            // --------------------------------------------------
            // Agar tumhara frontend direct orderId/amount use
            // karta hai, ye fields bhi available rahengi.
            // --------------------------------------------------

            orderId:
                order.id,

            amount:
                order.amount,

            currency:
                order.currency,


            // --------------------------------------------------
            // DATABASE PAYMENT ID
            // --------------------------------------------------

            paymentId:
                payment._id,


            // --------------------------------------------------
            // PAYMENT INFORMATION
            // --------------------------------------------------

            payment: {

                id:
                    payment._id,

                amount:
                    payment.amount,

                status:
                    payment.status,

                razorpayOrderId:
                    payment.razorpayOrderId

            },


            // --------------------------------------------------
            // PATIENT INFORMATION
            // --------------------------------------------------

            patient: {

                name:
                    `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),

                email:
                    req.user.email || "",

                phone:
                    req.user.phone || ""

            },


            // --------------------------------------------------
            // DOCTOR INFORMATION
            // --------------------------------------------------

            doctor: {

                id:
                    appointment.doctor._id,

                name:
                    `Dr. ${appointment.doctor.firstName || ""} ${appointment.doctor.lastName || ""}`.trim(),

                specialization:
                    appointment.doctor.specialization || "",

                consultationFee:
                    amount

            }

        });


    } catch (error) {

        // ======================================================
        // ERROR HANDLING
        // ======================================================

        console.error(
            "Create Razorpay Order Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create payment order",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });
    }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /patient/payments/verify
// ==========================================

exports.verifyPayment =
    async (req, res) => {

        try {

            const {
                paymentId,
                razorpayPaymentId,
                razorpaySignature
            } = req.body;


            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                !paymentId ||
                !razorpayPaymentId ||
                !razorpaySignature
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment verification data is incomplete"

                });
            }


            // ==========================================
            // FIND PAYMENT
            // ==========================================

            const payment =
                await Payment.findOne({

                    _id:
                        paymentId,

                    patient:
                        req.user._id

                });


            if (!payment) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Payment record not found"

                });
            }


            // ==========================================
            // ALREADY PAID
            // ==========================================

            if (
                payment.status ===
                "Paid"
            ) {

                return res.json({

                    success: true,

                    message:
                        "Payment already verified"

                });
            }


            // ==========================================
            // ORDER ID CHECK
            // ==========================================

            if (
                !payment.razorpayOrderId
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Razorpay order ID is missing"

                });
            }


            // ==========================================
            // GENERATE SIGNATURE
            // ==========================================

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${payment.razorpayOrderId}|${razorpayPaymentId}`
                    )
                    .digest("hex");


            // ==========================================
            // SAFE SIGNATURE COMPARISON
            // ==========================================

            const received =
                Buffer.from(
                    String(
                        razorpaySignature
                    ),
                    "utf8"
                );

            const generated =
                Buffer.from(
                    generatedSignature,
                    "utf8"
                );


            if (
                received.length !==
                generated.length ||
                !crypto.timingSafeEqual(
                    received,
                    generated
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment verification failed"

                });
            }


            // ==========================================
            // MARK PAYMENT AS PAID
            // ==========================================

            payment.status =
                "Paid";

            payment.razorpayPaymentId =
                razorpayPaymentId;

            payment.razorpaySignature =
                razorpaySignature;

            payment.paidAt =
                new Date();


            await payment.save();

            const paymentLink = payment.appointment ? `/patient/appointments/${payment.appointment}` : "/patient/payments";
            await notify({ app: req.app, user: payment.patient, type: "payment_success", title: "Payment Successful", message: `Your payment of ₹${payment.amount} was verified successfully.`, link: paymentLink, eventKey: `payment-success-patient:${payment._id}`, emailDetails: [{ label: "Amount", value: `₹${payment.amount}` }] });
            if (payment.doctor) await notify({ app: req.app, user: payment.doctor, type: "payment_received", title: "Payment Received", message: `Payment of ₹${payment.amount} was received from ${req.user.fullName || req.user.firstName || "a patient"}.`, link: payment.appointment ? `/doctor/appointments/${payment.appointment}` : "/doctor/earnings", eventKey: `payment-received-doctor:${payment._id}`, emailDetails: [{ label: "Amount", value: `₹${payment.amount}` }] });


            // ==========================================
            // Legacy in-app notification is superseded by notificationService above.
            // ==========================================

            try {

                if (false && payment.doctor) {

                    await Notification.create({

                        user:
                            payment.doctor,

                        title:
                            "Payment Received",

                        message:
                            `Payment of ₹${payment.amount} received from ${req.user.firstName || "patient"} for an appointment.`,

                        type:
                            "payment"

                    });
                }

            } catch (notificationError) {

                console.error(
                    "Payment Notification Error:",
                    notificationError
                );
            }


            // ==========================================
            // SUCCESS RESPONSE
            // ==========================================

            return res.json({

                success: true,

                message:
                    "Payment verified successfully",

                payment: {

                    id:
                        payment._id,

                    amount:
                        payment.amount,

                    status:
                        payment.status,

                    paidAt:
                        payment.paidAt

                }

            });

        } catch (error) {

            console.error(
                "Verify Razorpay Payment Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to verify payment"

            });
        }
    };
