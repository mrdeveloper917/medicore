const { body } = require("express-validator");

exports.educationValidation = [

    body("degree")
        .trim()
        .notEmpty()
        .withMessage("Degree is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Degree must be between 2 and 100 characters"),

    body("college")
        .trim()
        .notEmpty()
        .withMessage("College is required")
        .isLength({ min: 2, max: 150 }),

    body("university")
        .trim()
        .notEmpty()
        .withMessage("University is required")
        .isLength({ min: 2, max: 150 }),

    body("startYear")
        .isInt({
            min:1900,
            max:new Date().getFullYear()
        })
        .withMessage("Invalid Start Year"),

    body("endYear")
        .isInt({
            min:1900,
            max:new Date().getFullYear()+10
        })
        .withMessage("Invalid End Year")

];