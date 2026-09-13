const mongoose=require("mongoose");

const prescriptionSchema=new mongoose.Schema({

patient:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

doctor:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

medicine:String,

dosage:String,

notes:String

},{
timestamps:true
});

module.exports=
mongoose.model(
"Prescription",
prescriptionSchema
);