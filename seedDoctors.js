const mongoose = require("mongoose");
const User = require("./models/User");

require("dotenv").config();

/* =========================================================
   COMMON AVAILABILITY
   MONDAY - SUNDAY
   10:00 AM - 09:00 PM
========================================================= */

const availability = [
  {
    day: "Monday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Tuesday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Wednesday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Thursday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Friday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Saturday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  },
  {
    day: "Sunday",
    startTime: "10:00",
    endTime: "21:00",
    isAvailable: true
  }
];


/* =========================================================
   25 FICTIONAL DEMO DOCTORS

   Areas:
   Bahal
   Patwan
   Loharu
   Gokalpura
   Sirsi
   Chahar Kalan
   Nakipur
   Pahari
   Bhiwani
========================================================= */

const doctorData = [

  {
    firstName: "Aarav",
    lastName: "Sharma",
    gender: "Male",
    city: "Bahal",
    pincode: "127028",
    address: "Bahal Main Road",
    specialization: "General Medicine",
    qualification: "MBBS, MD",
    experience: 9,
    consultationFee: 500
  },

  {
    firstName: "Meera",
    lastName: "Verma",
    gender: "Female",
    city: "Loharu",
    pincode: "127201",
    address: "Loharu Hospital Road",
    specialization: "Internal Medicine",
    qualification: "MBBS, DNB",
    experience: 11,
    consultationFee: 600
  },

  {
    firstName: "Kabir",
    lastName: "Singh",
    gender: "Male",
    city: "Loharu",
    pincode: "127201",
    address: "Loharu Main Market",
    specialization: "Orthopedics",
    qualification: "MBBS, MS",
    experience: 13,
    consultationFee: 700
  },

  {
    firstName: "Ishita",
    lastName: "Yadav",
    gender: "Female",
    city: "Patwan",
    pincode: "127030",
    address: "Patwan Main Road",
    specialization: "Obstetrics & Gynecology",
    qualification: "MBBS, DGO",
    experience: 8,
    consultationFee: 600
  },

  {
    firstName: "Rohan",
    lastName: "Kumar",
    gender: "Male",
    city: "Gokalpura",
    pincode: "127031",
    address: "Gokalpura Main Road",
    specialization: "Pediatrics",
    qualification: "MBBS, MD",
    experience: 10,
    consultationFee: 550
  },

  {
    firstName: "Neha",
    lastName: "Choudhary",
    gender: "Female",
    city: "Sirsi",
    pincode: "127032",
    address: "Sirsi School Road",
    specialization: "Pediatrics",
    qualification: "MBBS, DCH",
    experience: 7,
    consultationFee: 500
  },

  {
    firstName: "Vikram",
    lastName: "Dalal",
    gender: "Male",
    city: "Chahar Kalan",
    pincode: "127201",
    address: "Chahar Kalan Main Road",
    specialization: "General Surgery",
    qualification: "MBBS, MS",
    experience: 14,
    consultationFee: 800
  },

  {
    firstName: "Pooja",
    lastName: "Malik",
    gender: "Female",
    city: "Nakipur",
    pincode: "127033",
    address: "Nakipur Main Road",
    specialization: "Dermatology",
    qualification: "MBBS, MD",
    experience: 9,
    consultationFee: 650
  },

  {
    firstName: "Arjun",
    lastName: "Mehta",
    gender: "Male",
    city: "Pahari",
    pincode: "127034",
    address: "Pahari Main Road",
    specialization: "Cardiology",
    qualification: "MBBS, MD, DM",
    experience: 16,
    consultationFee: 1000
  },

  {
    firstName: "Nisha",
    lastName: "Rathi",
    gender: "Female",
    city: "Bhiwani",
    pincode: "127021",
    address: "Bhiwani Civil Lines",
    specialization: "Psychiatry",
    qualification: "MBBS, MD",
    experience: 8,
    consultationFee: 700
  },

  {
    firstName: "Rahul",
    lastName: "Bansal",
    gender: "Male",
    city: "Bahal",
    pincode: "127028",
    address: "Bahal Bus Stand Road",
    specialization: "General Medicine",
    qualification: "MBBS, MD",
    experience: 8,
    consultationFee: 500
  },

  {
    firstName: "Simran",
    lastName: "Kaur",
    gender: "Female",
    city: "Patwan",
    pincode: "127030",
    address: "Patwan Market Road",
    specialization: "Gynecology",
    qualification: "MBBS, DGO",
    experience: 10,
    consultationFee: 650
  },

  {
    firstName: "Manish",
    lastName: "Saini",
    gender: "Male",
    city: "Gokalpura",
    pincode: "127031",
    address: "Gokalpura Bus Stand Road",
    specialization: "Orthopedics",
    qualification: "MBBS, MS",
    experience: 12,
    consultationFee: 700
  },

  {
    firstName: "Kavya",
    lastName: "Dahiya",
    gender: "Female",
    city: "Sirsi",
    pincode: "127032",
    address: "Sirsi Main Road",
    specialization: "Dermatology",
    qualification: "MBBS, MD",
    experience: 7,
    consultationFee: 600
  },

  {
    firstName: "Deepak",
    lastName: "Yadav",
    gender: "Male",
    city: "Chahar Kalan",
    pincode: "127201",
    address: "Chahar Kalan Market Road",
    specialization: "General Surgery",
    qualification: "MBBS, MS",
    experience: 15,
    consultationFee: 800
  },

  {
    firstName: "Ritika",
    lastName: "Sharma",
    gender: "Female",
    city: "Nakipur",
    pincode: "127033",
    address: "Nakipur Hospital Road",
    specialization: "Pediatrics",
    qualification: "MBBS, MD",
    experience: 9,
    consultationFee: 550
  },

  {
    firstName: "Mohit",
    lastName: "Kumar",
    gender: "Male",
    city: "Pahari",
    pincode: "127034",
    address: "Pahari Main Chowk",
    specialization: "ENT",
    qualification: "MBBS, MS",
    experience: 11,
    consultationFee: 650
  },

  {
    firstName: "Ananya",
    lastName: "Rana",
    gender: "Female",
    city: "Bhiwani",
    pincode: "127021",
    address: "Bhiwani Hansi Road",
    specialization: "General Medicine",
    qualification: "MBBS, MD",
    experience: 6,
    consultationFee: 500
  },

  {
    firstName: "Sahil",
    lastName: "Chauhan",
    gender: "Male",
    city: "Bhiwani",
    pincode: "127021",
    address: "Bhiwani Circular Road",
    specialization: "Orthopedics",
    qualification: "MBBS, MS",
    experience: 13,
    consultationFee: 750
  },

  {
    firstName: "Priya",
    lastName: "Goyal",
    gender: "Female",
    city: "Loharu",
    pincode: "127201",
    address: "Loharu Railway Road",
    specialization: "Obstetrics & Gynecology",
    qualification: "MBBS, DGO",
    experience: 8,
    consultationFee: 600
  },

  {
    firstName: "Vivek",
    lastName: "Tanwar",
    gender: "Male",
    city: "Bahal",
    pincode: "127028",
    address: "Bahal College Road",
    specialization: "Cardiology",
    qualification: "MBBS, MD",
    experience: 17,
    consultationFee: 1000
  },

  {
    firstName: "Komal",
    lastName: "Punia",
    gender: "Female",
    city: "Patwan",
    pincode: "127030",
    address: "Patwan Community Road",
    specialization: "Dermatology",
    qualification: "MBBS, MD",
    experience: 6,
    consultationFee: 600
  },

  {
    firstName: "Amit",
    lastName: "Sheoran",
    gender: "Male",
    city: "Gokalpura",
    pincode: "127031",
    address: "Gokalpura Main Chowk",
    specialization: "General Medicine",
    qualification: "MBBS, MD",
    experience: 10,
    consultationFee: 550
  },

  {
    firstName: "Sonia",
    lastName: "Dalal",
    gender: "Female",
    city: "Sirsi",
    pincode: "127032",
    address: "Sirsi Village Road",
    specialization: "Pediatrics",
    qualification: "MBBS, DCH",
    experience: 7,
    consultationFee: 500
  },

  {
    firstName: "Harsh",
    lastName: "Verma",
    gender: "Male",
    city: "Bhiwani",
    pincode: "127021",
    address: "Bhiwani Tosham Road",
    specialization: "General Surgery",
    qualification: "MBBS, MS",
    experience: 14,
    consultationFee: 800
  }

];


/* =========================================================
   CREATE COMPLETE DOCTOR OBJECTS
========================================================= */

const doctors = doctorData.map((doctor, index) => {

  const number = index + 1;

  const firstNameSlug =
    doctor.firstName.toLowerCase();

  const lastNameSlug =
    doctor.lastName.toLowerCase();

  const onlineFee =
    Math.max(
      300,
      doctor.consultationFee - 100
    );

  const startYear =
    2026 - doctor.experience - 6;


  return {

    /* -----------------------------------------------------
       BASIC INFORMATION
    ----------------------------------------------------- */

    firstName: doctor.firstName,

    lastName: doctor.lastName,

    email:
      `${firstNameSlug}.${lastNameSlug}.doctor${number}@example.com`,

    phone:
      `99999${String(10000 + number).slice(-5)}`,

    password: "Doctor@123",

    role: "doctor",

    gender: doctor.gender,


    /* -----------------------------------------------------
       PROFILE IMAGES
    ----------------------------------------------------- */

    profileImage:
      `https://i.pravatar.cc/600?img=${10 + number}`,

    coverImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",


    /* -----------------------------------------------------
       LOCATION
    ----------------------------------------------------- */

    address: doctor.address,

    city: doctor.city,

    state: "Haryana",

    country: "India",

    pincode: doctor.pincode,


    /* -----------------------------------------------------
       PROFESSIONAL INFORMATION
    ----------------------------------------------------- */

    qualification:
      doctor.qualification,

    specialization:
      doctor.specialization,

    registrationNumber:
      `MC-DEMO-${String(number).padStart(3, "0")}`,

    hospital:
      `MediCore ${doctor.city} ${doctor.specialization} Centre`,

    clinic:
      `MediCore ${doctor.specialization} Clinic - ${doctor.city}`,


    /* -----------------------------------------------------
       EXPERIENCE & FEES
    ----------------------------------------------------- */

    experience:
      doctor.experience,

    consultationFee:
      doctor.consultationFee,

    onlineConsultationFee:
      onlineFee,

    followUpDays:
      doctor.specialization === "Cardiology"
        ? 14
        : 7,


    /* -----------------------------------------------------
       BIO
    ----------------------------------------------------- */

    bio:
      `Dr. ${doctor.firstName} ${doctor.lastName} is a fictional MediCore demo ${doctor.specialization.toLowerCase()} profile serving patients in ${doctor.city}, Haryana. This profile is created for testing doctor search, appointment booking, payments, notifications and patient-doctor communication features.`,


    /* -----------------------------------------------------
       LANGUAGES
    ----------------------------------------------------- */

    languages: [
      "Hindi",
      "English",
      "Haryanvi"
    ],


    /* -----------------------------------------------------
       EDUCATION
    ----------------------------------------------------- */

    education: [

      {
        degree: "MBBS",

        college:
          "MediCore Demo Medical College",

        university:
          "MediCore Demo Health University",

        startYear:
          startYear,

        endYear:
          startYear + 5
      },

      {
        degree:
          doctor.qualification
            .split(", ")
            .slice(1)
            .join(", ") || "Medical Specialization",

        college:
          "MediCore Demo Medical Institute",

        university:
          "MediCore Demo Health University",

        startYear:
          startYear + 6,

        endYear:
          startYear + 8
      }

    ],


    /* -----------------------------------------------------
       EXPERIENCE DETAILS
    ----------------------------------------------------- */

    experienceDetails: [

      {
        hospital:
          `MediCore ${doctor.city} ${doctor.specialization} Centre`,

        position:
          `Consultant ${doctor.specialization}`,

        startDate:
          new Date(
            `${startYear + 9}-01-01`
          ),

        current: true
      }

    ],


    /* -----------------------------------------------------
       CERTIFICATES
    ----------------------------------------------------- */

    certificates: [

      {
        title:
          "Clinical Practice Certification",

        issuedBy:
          "MediCore Demo Training Institute",

        issueDate:
          new Date("2023-01-15")
      },

      {
        title:
          "Advanced Patient Care Certification",

        issuedBy:
          "MediCore Demo Medical Institute",

        issueDate:
          new Date("2024-04-20")
      }

    ],


    /* -----------------------------------------------------
       MEMBERSHIPS
    ----------------------------------------------------- */

    memberships: [

      "MediCore Demo Medical Association",

      "MediCore Professional Healthcare Network"

    ],


    /* -----------------------------------------------------
       AVAILABILITY
       MONDAY - SUNDAY
       10:00 - 21:00
    ----------------------------------------------------- */

    availability: availability.map(slot => ({
      ...slot
    })),


    /* -----------------------------------------------------
       STATUS
    ----------------------------------------------------- */

    isVerified: true,

    isBlocked: false

  };

});


/* =========================================================
   SEED DATABASE
========================================================= */

async function seedDoctors() {

  try {

    /* -----------------------------------------------------
       CHECK MONGO URL
    ----------------------------------------------------- */

    if (!process.env.MONGO_URL) {

      throw new Error(
        "MONGO_URL is missing in .env"
      );

    }


    /* -----------------------------------------------------
       CONNECT DATABASE
    ----------------------------------------------------- */

    await mongoose.connect(
      process.env.MONGO_URL
    );

    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "       MongoDB Connected"
    );

    console.log(
      "========================================"
    );


    /* -----------------------------------------------------
       DELETE OLD DEMO DOCTORS
    ----------------------------------------------------- */

    const deleted =
      await User.deleteMany({

        role: "doctor",

        email: {
          $regex:
            /@example\.com$/i
        }

      });


    console.log(
      `Removed ${deleted.deletedCount} old demo doctors.`
    );


    /* -----------------------------------------------------
       INSERT 25 DOCTORS
    ----------------------------------------------------- */

    const createdDoctors =
      await User.create(
        doctors
      );


    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "       DOCTOR SEED SUCCESSFUL"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Inserted ${createdDoctors.length} doctors.`
    );

    console.log("");

    console.log(
      "Availability:"
    );

    console.log(
      "Monday    : 10:00 - 21:00"
    );

    console.log(
      "Tuesday   : 10:00 - 21:00"
    );

    console.log(
      "Wednesday : 10:00 - 21:00"
    );

    console.log(
      "Thursday  : 10:00 - 21:00"
    );

    console.log(
      "Friday    : 10:00 - 21:00"
    );

    console.log(
      "Saturday  : 10:00 - 21:00"
    );

    console.log(
      "Sunday    : 10:00 - 21:00"
    );

    console.log("");

    console.log(
      "Demo Doctor Password:"
    );

    console.log(
      "Doctor@123"
    );

    console.log("");

    console.log(
      "========================================"
    );


    /* -----------------------------------------------------
       CLOSE CONNECTION
    ----------------------------------------------------- */

    await mongoose.connection.close();

    process.exit(0);

  } catch (error) {

    console.error("");

    console.error(
      "========================================"
    );

    console.error(
      "       DOCTOR SEED FAILED"
    );

    console.error(
      "========================================"
    );

    console.error(
      error
    );


    try {

      await mongoose.connection.close();

    } catch (closeError) {

      // Ignore close error

    }

    process.exit(1);

  }

}


/* =========================================================
   RUN
========================================================= */

seedDoctors();