require("dotenv").config();

const transporter = require("./config/mail");

async function testMail() {

    try {

        await transporter.verify();

        console.log("✅ Email Server Connected");

    }

    catch(err){

        console.log("❌ Email Error");

        console.log(err);

    }

}

testMail();