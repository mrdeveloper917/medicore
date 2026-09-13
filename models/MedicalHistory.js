const mongoose = require("mongoose");

const medicalHistorySchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment"
        },

        diagnosis: {
            type: String,
            trim: true
        },

        symptoms: {
            type: String,
            trim: true
        },

        treatment: {
            type: String,
            trim: true
        },

        medicines: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true
        },

        visitDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "MedicalHistory",
    medicalHistorySchema
);