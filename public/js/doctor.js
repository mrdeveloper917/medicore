document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // DOCTOR GENERAL JAVASCRIPT
    // ==========================================

    console.log("Doctor JS Loaded");


    // ==========================================
    // PROTECT PDF / DOCUMENT LINKS
    // ==========================================

    document.querySelectorAll(
        'a[target="_blank"]'
    ).forEach(function (link) {

        const href = link.getAttribute("href");

        if (!href) {
            return;
        }

        /*
         * Do NOT preventDefault here.
         *
         * target="_blank" links such as
         * certificate PDF links must work normally.
         */

        link.addEventListener("click", function (event) {

            event.stopPropagation();

        });

    });

});