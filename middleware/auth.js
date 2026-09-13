const jwt=require("jsonwebtoken");

const User=require("../models/User");

const protect=async(req,res,next)=>{

try{

const token=req.cookies.token;

if(!token){

return res.redirect("/login");

}

const decoded=jwt.verify(
token,
process.env.JWT_SECRET
);

req.user=await User.findById(decoded.id);

next();

}

catch(err){

res.redirect("/login");

}

}

module.exports=protect;