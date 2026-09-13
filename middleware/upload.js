const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload Directory
const uploadPath = path.join(
    __dirname,
    "../public/uploads/profiles"
);

// Create folder if not exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadPath);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9);

        cb(

            null,

            "profile-" +
            uniqueName +
            path.extname(file.originalname)

        );

    }

});

// Allowed Images
const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        "image/jpeg",

        "image/jpg",

        "image/png",

        "image/webp"

    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(

            new Error(

                "Only JPG, JPEG, PNG and WEBP images are allowed."

            ),

            false

        );

    }

};

// Upload Instance
const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 2 * 1024 * 1024 // 2MB

    }

});

module.exports = upload;