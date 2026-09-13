document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // CURRENT DATE
    // ==========================================

    const date = document.getElementById("currentDate");

    if (date) {
        date.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    // ==========================================
    // LOGOUT CONFIRMATION
    // ==========================================

    const logout = document.querySelector('a[href="/logout"]');

    if (logout) {

        logout.addEventListener("click", function (event) {

            const confirmed = confirm(
                "Are you sure you want to logout?"
            );

            if (!confirmed) {
                event.preventDefault();
            }

        });

    }


    // ==========================================
    // DEBUG
    // ==========================================

    console.log("Doctor Dashboard JS Loaded");

});