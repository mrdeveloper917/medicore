const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// CREATE UPLOAD FOLDERS AUTOMATICALLY
// =====================================================

const folders = [
  "public/uploads/doctors/profile",
  "public/uploads/doctors/cover",
  "public/uploads/doctors/certificates",
  "public/uploads/doctors/awards",
];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

  // ---------------------------------------------------
  // DESTINATION
  // ---------------------------------------------------

  destination(req, file, cb) {

    switch (file.fieldname) {

      // Doctor Profile Image
      case "profileImage":
        cb(null, "public/uploads/doctors/profile");
        break;

      // Doctor Cover Image
      case "coverImage":
        cb(null, "public/uploads/doctors/cover");
        break;

      // Doctor Certificate
      case "certificate":
        cb(null, "public/uploads/doctors/certificates");
        break;

      // Doctor Award
      case "award":
        cb(null, "public/uploads/doctors/awards");
        break;

      default:
        cb(
          new Error(
            "Invalid upload field. Allowed fields: profileImage, coverImage, certificate, award"
          )
        );
        break;
    }
  },

  // ---------------------------------------------------
  // FILE NAME
  // ---------------------------------------------------

  filename(req, file, cb) {

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {

  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const documentTypes = [
    "application/pdf",
  ];

  const allowedTypes = [
    ...imageTypes,
    ...documentTypes,
  ];

  if (allowedTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP and PDF files are allowed."
      ),
      false
    );
  }
};

// =====================================================
// MULTER UPLOAD CONFIGURATION
// =====================================================

const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

});

// =====================================================
// EXPORT
// =====================================================

module.exports = upload;