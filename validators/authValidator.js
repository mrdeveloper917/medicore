const {body}=require("express-validator");

exports.registerValidation=[

body("firstName")
.notEmpty()
.withMessage("First Name Required"),

body("lastName")
.notEmpty()
.withMessage("Last Name Required"),

body("email")
.isEmail()
.withMessage("Invalid Email"),

body("phone")
.isLength({min:10,max:10})
.withMessage("Invalid Phone"),

body("password")
.isLength({min:8})
.withMessage("Password must be at least 8 characters"),

body("role")
.notEmpty()
.withMessage("Role required")
.isIn(["admin","doctor","patient","receptionist","nurse"])
.withMessage("Invalid role"),

];
