const Doctor = require("../models/Doctor");

// ============================================================
// HOME PAGE
// GET /
// ============================================================
exports.getHome = async (req, res) => {
    try {
        // Get active doctors from database
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
                consultationFee
                onlineConsultationFee
            `)
            .sort({
                isVerified: -1,
                name: 1
            })
            .limit(6)
            .lean();

        res.render("home", {
            title: "Doctor Appointment System",
            doctors
        });

    } catch (error) {
        console.error("Home page error:", error);

        // Don't break the homepage if doctor fetching fails
        res.render("home", {
            title: "Doctor Appointment System",
            doctors: []
        });
    }
};