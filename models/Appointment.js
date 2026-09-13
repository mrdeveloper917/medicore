const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    department:{
        type:String,
        required:true
    },

    appointmentDate:{
        type:Date,
        required:true
    },

    appointmentTime:{
        type:String,
        required:true
    },

    status:{
        type:String,
        enum:[
            "Pending",
            "Approved",
            "Rejected",
            "Completed",
            "Cancelled"
        ],
        default:"Pending"
    }

},{
    timestamps:true
});

module.exports =
mongoose.model("Appointment",appointmentSchema);
