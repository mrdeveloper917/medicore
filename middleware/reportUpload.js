// ============================================================
// MEDICORE - REPORT UPLOAD MIDDLEWARE
// ============================================================

const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ============================================================
// REPORT UPLOAD DIRECTORY
// ============================================================

const uploadDir = path.join(
    __dirname,
    "../public/uploads/reports"
);


// ============================================================
// CREATE DIRECTORY
// ============================================================

try {

    if (!fs.existsSync(uploadDir)) {

        fs.mkdirSync(uploadDir, {
            recursive: true
        });

    }

} catch (error) {

    console.error(
        "Report Upload Directory Error:",
        error
    );

    throw error;
}


// ============================================================
// ALLOWED FILE TYPES
// ============================================================

const allowedTypes = {

    ".pdf": [
        "application/pdf"
    ],

    ".jpg": [
        "image/jpeg"
    ],

    ".jpeg": [
        "image/jpeg"
    ],

    ".png": [
        "image/png"
    ]

};


// ============================================================
// STORAGE
// ============================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            uploadDir
        );

    },


    filename: function (req, file, cb) {

        try {

            const originalName =
                path.basename(
                    file.originalname
                );


            const extension =
                path.extname(
                    originalName
                ).toLowerCase();


            const baseName =
                path.basename(
                    originalName,
                    path.extname(originalName)
                );


            // Remove unsafe characters
            const safeName =
                baseName
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "-"
                    )
                    .replace(
                        /-+/g,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        ""
                    )
                    .toLowerCase();


            const finalName =
                safeName ||
                "medical-report";


            const uniqueName =
                `${Date.now()}-${Math.round(
                    Math.random() * 1e9
                )}-${finalName}${extension}`;


            cb(
                null,
                uniqueName
            );

        } catch (error) {

            cb(error);

        }

    }

});


// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = function (
    req,
    file,
    cb
) {

    try {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const mimeType =
            file.mimetype;


        // ----------------------------------------------------
        // CHECK EXTENSION
        // ----------------------------------------------------

        if (
            !Object.prototype.hasOwnProperty.call(
                allowedTypes,
                extension
            )
        ) {

            return cb(
                new multer.MulterError(
                    "LIMIT_UNEXPECTED_FILE"
                ),
                false
            );

        }


        // ----------------------------------------------------
        // CHECK MIME TYPE
        // ----------------------------------------------------

        const validMimeTypes =
            allowedTypes[extension];


        if (
            !validMimeTypes.includes(
                mimeType
            )
        ) {

            return cb(
                new Error(
                    "Invalid report file type."
                ),
                false
            );

        }


        // ----------------------------------------------------
        // FILE ACCEPTED
        // ----------------------------------------------------

        cb(
            null,
            true
        );

    } catch (error) {

        cb(error, false);

    }

};


// ============================================================
// MULTER CONFIGURATION
// ============================================================

const reportUpload = multer({

    storage,

    fileFilter,

    limits: {

        // Maximum file size = 5 MB
        fileSize:
            5 * 1024 * 1024,

        // Only one file
        files: 1

    }

});


// ============================================================
// EXPORT
// ============================================================

module.exports = reportUpload;