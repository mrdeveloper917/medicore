const { body } = require("express-validator");

exports.experienceValidation = [

    body("hospital")
        .trim()
        .notEmpty()
        .withMessage("Hospital name is required.")
        .isLength({ min: 2, max: 150 })
        .withMessage("Hospital name must be between 2 and 150 characters."),

    body("position")
        .trim()
        .notEmpty()
        .withMessage("Position is required.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Position must be between 2 and 100 characters."),

    body("startDate")
        .notEmpty()
        .withMessage("Start Date is required.")
        .isISO8601()
        .withMessage("Invalid Start Date."),

    body("endDate")
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage("Invalid End Date.")

];