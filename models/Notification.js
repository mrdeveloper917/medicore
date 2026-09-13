const mongoose=require("mongoose");

const notificationSchema=new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true,
index:true
},

type:{ type:String, default:"system", trim:true },

title:{ type:String, default:"Notification", trim:true },

message:{ type:String, required:true, trim:true },

link:{ type:String, default:"", trim:true },

// A domain event key makes retries (for example Razorpay verification) idempotent.
eventKey:{ type:String, sparse:true },

isRead:{
type:Boolean,
default:false
}

},{
timestamps:true
});

notificationSchema.index({ user:1, isRead:1, createdAt:-1 });
notificationSchema.index({ user:1, eventKey:1 }, { unique:true, sparse:true });

module.exports=
mongoose.model(
"Notification",
notificationSchema
);
