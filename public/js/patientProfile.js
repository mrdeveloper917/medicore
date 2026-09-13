/* ==========================================
   PATIENT PROFILE JAVASCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       IMAGE PREVIEW
    ===================================== */

    const profileImage =
        document.getElementById("profileImage");

    const preview =
        document.getElementById("profilePreview");

    if (profileImage && preview) {

        profileImage.addEventListener("change", (e) => {

            const file = e.target.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                alert("Please select a valid image.");

                profileImage.value = "";

                return;

            }

            const reader = new FileReader();

            reader.onload = function (event) {

                preview.src = event.target.result;

            };

            reader.readAsDataURL(file);

        });

    }

    /* =====================================
       PHONE VALIDATION
    ===================================== */

    const phone =
        document.querySelector("input[name='phone']");

    if (phone) {

        phone.addEventListener("input", () => {

            phone.value =
                phone.value.replace(/\D/g, "");

            if (phone.value.length > 10) {

                phone.value =
                    phone.value.substring(0, 10);

            }

        });

    }

    /* =====================================
       PINCODE VALIDATION
    ===================================== */

    const pincode =
        document.querySelector("input[name='pincode']");

    if (pincode) {

        pincode.addEventListener("input", () => {

            pincode.value =
                pincode.value.replace(/\D/g, "");

            if (pincode.value.length > 6) {

                pincode.value =
                    pincode.value.substring(0, 6);

            }

        });

    }

    /* =====================================
       HEIGHT VALIDATION
    ===================================== */

    const height =
        document.querySelector("input[name='height']");

    if (height) {

        height.addEventListener("input", () => {

            if (height.value < 30)

                height.value = 30;

            if (height.value > 250)

                height.value = 250;

        });

    }

    /* =====================================
       WEIGHT VALIDATION
    ===================================== */

    const weight =
        document.querySelector("input[name='weight']");

    if (weight) {

        weight.addEventListener("input", () => {

            if (weight.value < 1)

                weight.value = 1;

            if (weight.value > 300)

                weight.value = 300;

        });

    }

    /* =====================================
       BLOOD GROUP VALIDATION
    ===================================== */

    const blood =
        document.querySelector("input[name='bloodGroup']");

    const validBloodGroups = [

        "A+","A-",

        "B+","B-",

        "AB+","AB-",

        "O+","O-"

    ];

    if (blood) {

        blood.addEventListener("blur", () => {

            const value =
                blood.value.toUpperCase().trim();

            if (

                value !== "" &&

                !validBloodGroups.includes(value)

            ) {

                alert(

                    "Invalid Blood Group"

                );

                blood.focus();

            }

        });

    }

    /* =====================================
       AUTO CAPITALIZE
    ===================================== */

    document

    .querySelectorAll(

        "input[type='text']"

    )

    .forEach(input => {

        input.addEventListener("blur", () => {

            input.value =

                input.value

                .replace(/\b\w/g,

                    char =>

                    char.toUpperCase());

        });

    });

    /* =====================================
       UNSAVED CHANGES
    ===================================== */

    let changed = false;

    const form =

        document.getElementById("profileForm");

    if (form) {

        form

        .querySelectorAll(

            "input, textarea, select"

        )

        .forEach(field => {

            field.addEventListener(

                "change",

                () => {

                    changed = true;

                }

            );

        });

        form.addEventListener(

            "submit",

            () => {

                changed = false;

            }

        );

    }

    window.addEventListener(

        "beforeunload",

        (e) => {

            if (!changed) return;

            e.preventDefault();

            e.returnValue = "";

        }

    );

    /* =====================================
       SAVE BUTTON LOADING
    ===================================== */

    const saveButton =

        document.querySelector(".save-btn");

    if (saveButton && form) {

        form.addEventListener("submit", () => {

            saveButton.disabled = true;

            saveButton.innerHTML =

                '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        });

    }

});