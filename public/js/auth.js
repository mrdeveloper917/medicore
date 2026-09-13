/* ===========================================
   DOCTOR APPOINTMENT SYSTEM
   AUTH JAVASCRIPT
=========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       ELEMENTS
    =============================== */

    const registerForm = document.getElementById("registerForm");

    const password = document.getElementById("password");

    const confirmPassword = document.getElementById("confirmPassword");

    const togglePassword = document.getElementById("togglePassword");

    const strengthBar = document.getElementById("strengthBar");

    const profileImage = document.getElementById("profileImage");

    const preview = document.getElementById("preview");

    const email = document.querySelector("input[name='email']");

    const phone = document.querySelector("input[name='phone']");

    /* ===============================
       SHOW / HIDE PASSWORD
    =============================== */

    if (togglePassword) {

        togglePassword.addEventListener("click", () => {

            if (password.type === "password") {

                password.type = "text";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye-slash"></i>';

            } else {

                password.type = "password";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye"></i>';

            }

        });

    }

    /* ===============================
       PASSWORD STRENGTH
    =============================== */

    if (password) {

        password.addEventListener("keyup", () => {

            const value = password.value;

            let strength = 0;

            if (value.length >= 8) strength++;

            if (/[A-Z]/.test(value)) strength++;

            if (/[a-z]/.test(value)) strength++;

            if (/[0-9]/.test(value)) strength++;

            if (/[^A-Za-z0-9]/.test(value)) strength++;

            switch (strength) {

                case 0:
                case 1:

                    strengthBar.style.width = "20%";
                    strengthBar.style.background = "#ef4444";
                    break;

                case 2:

                    strengthBar.style.width = "40%";
                    strengthBar.style.background = "#f97316";
                    break;

                case 3:

                    strengthBar.style.width = "60%";
                    strengthBar.style.background = "#facc15";
                    break;

                case 4:

                    strengthBar.style.width = "80%";
                    strengthBar.style.background = "#3b82f6";
                    break;

                case 5:

                    strengthBar.style.width = "100%";
                    strengthBar.style.background = "#22c55e";
                    break;

            }

        });

    }

    /* ===============================
       IMAGE PREVIEW
    =============================== */

    if (profileImage) {

        profileImage.addEventListener("change", function () {

            const file = this.files[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = function (e) {

                preview.src = e.target.result;

            };

            reader.readAsDataURL(file);

        });

    }

    /* ===============================
       PHONE VALIDATION
    =============================== */

    if (phone) {

        phone.addEventListener("input", () => {

            phone.value = phone.value.replace(/[^0-9]/g, "");

            if (phone.value.length > 10) {

                phone.value = phone.value.slice(0, 10);

            }

        });

    }

    /* ===============================
       EMAIL VALIDATION
    =============================== */

    function validEmail(emailValue) {

        const regex =

            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return regex.test(emailValue);

    }

    /* ===============================
       REGISTER VALIDATION
    =============================== */

    if (registerForm) {

        registerForm.addEventListener("submit", (e) => {

            const firstNameInput = document.querySelector("input[name='firstName']");
            const lastNameInput = document.querySelector("input[name='lastName']");

            if (!firstNameInput.value.trim()) {

                e.preventDefault();

                alert("First Name is required.");

                return;

            }

            if (!lastNameInput.value.trim()) {

                e.preventDefault();

                alert("Last Name is required.");

                return;

            }

            if (!validEmail(email.value)) {

                e.preventDefault();

                alert("Please enter a valid email.");

                return;

            }

            if (phone.value.length !== 10) {

                e.preventDefault();

                alert("Phone number must be exactly 10 digits.");

                return;

            }

            if (password.value.length < 8) {

                e.preventDefault();

                alert("Password should be at least 8 characters.");

                return;

            }

            if (password.value !== confirmPassword.value) {

                e.preventDefault();

                alert("Passwords do not match.");

                return;

            }

        });

    }

});

/*================ LOGIN PASSWORD =================*/

const loginPassword=document.getElementById("loginPassword");

const loginToggle=document.getElementById("loginToggle");

if(loginToggle){

loginToggle.addEventListener("click",()=>{

if(loginPassword.type==="password"){

loginPassword.type="text";

loginToggle.innerHTML='<i class="fa-solid fa-eye-slash"></i>';

}else{

loginPassword.type="password";

loginToggle.innerHTML='<i class="fa-solid fa-eye"></i>';

}

});

}

/*==========================================
RESET PASSWORD
==========================================*/

const resetPassword =
document.getElementById("resetPassword");

const resetConfirm =
document.getElementById("resetConfirmPassword");

const resetToggle =
document.getElementById("resetToggle");

const resetStrength =
document.getElementById("resetStrengthBar");

if(resetToggle){

resetToggle.addEventListener("click",()=>{

if(resetPassword.type==="password"){

resetPassword.type="text";

resetToggle.innerHTML='<i class="fa-solid fa-eye-slash"></i>';

}else{

resetPassword.type="password";

resetToggle.innerHTML='<i class="fa-solid fa-eye"></i>';

}

});

}

if(resetPassword){

resetPassword.addEventListener("keyup",()=>{

let value=resetPassword.value;

let score=0;

if(value.length>=8)score++;

if(/[A-Z]/.test(value))score++;

if(/[a-z]/.test(value))score++;

if(/[0-9]/.test(value))score++;

if(/[^A-Za-z0-9]/.test(value))score++;

const width=[
"20%",
"40%",
"60%",
"80%",
"100%"
];

const color=[
"#ef4444",
"#f97316",
"#eab308",
"#3b82f6",
"#22c55e"
];

resetStrength.style.width=width[Math.max(score-1,0)];

resetStrength.style.background=color[Math.max(score-1,0)];

});

}

const resetForm=
document.getElementById("resetPasswordForm");

if(resetForm){

resetForm.addEventListener("submit",(e)=>{

if(resetPassword.value!==resetConfirm.value){

e.preventDefault();

alert("Passwords do not match.");

return;

}

if(resetPassword.value.length<8){

e.preventDefault();

alert("Password should contain at least 8 characters.");

}

});

}
