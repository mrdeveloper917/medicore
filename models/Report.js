const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({

    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    file: {
        type: String,
        required: true
    },

    reportDate: {
        type: Date,
        default: Date.now
    },

    description: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Report",
    reportSchema
);