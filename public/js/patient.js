/* ==========================================
   PATIENT DASHBOARD JAVASCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.getElementById("menuToggle");
    const navbarMenu = document.getElementById("navbarMenu");
    const closePatientMenu = () => {
        if (!menuToggle || !navbarMenu) return;
        navbarMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    };

    if (menuToggle && navbarMenu) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navbarMenu.classList.toggle("active");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });
        navbarMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closePatientMenu));
    }

    /* ==========================
       Animated Counters
    ========================== */

    const counters = document.querySelectorAll(".stat-card h2");

    const animateCounter = (counter) => {

        let target = counter.innerText
            .replace("₹", "")
            .replace(",", "")
            .trim();

        target = parseInt(target);

        if (isNaN(target)) return;

        let count = 0;

        const speed = Math.max(10, Math.floor(target / 80));

        const update = () => {

            count += speed;

            if (count >= target) {

                counter.innerText =
                    counter.innerText.includes("₹")
                        ? "₹ " + target
                        : target;

                return;

            }

            counter.innerText =
                counter.innerText.includes("₹")
                    ? "₹ " + count
                    : count;

            requestAnimationFrame(update);

        };

        update();

    };

    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                animateCounter(entry.target);

                observer.unobserve(entry.target);

            }

        });

    });

    counters.forEach(counter => observer.observe(counter));

    /* ==========================
       Current Date
    ========================== */

    const dateElement = document.getElementById("currentDate");

    if (dateElement) {

        const options = {

            weekday: "long",

            year: "numeric",

            month: "long",

            day: "numeric"

        };

        dateElement.innerText =
            new Date().toLocaleDateString(
                "en-IN",
                options
            );

    }

    /* ==========================
       Notification Badge
    ========================== */

    const badge = document.getElementById("notificationCount");

    if (badge) {

        const total = document.querySelectorAll(".notification-list li").length;

        badge.innerText = total;

    }

    /* ==========================
       Quick Action Hover
    ========================== */

    document
        .querySelectorAll(".quick-actions a")
        .forEach(btn => {

            btn.addEventListener("mouseenter", () => {

                btn.style.transform = "translateY(-6px)";

            });

            btn.addEventListener("mouseleave", () => {

                btn.style.transform = "translateY(0px)";

            });

        });

    /* ==========================
       Welcome Animation
    ========================== */

    const banner = document.querySelector(".welcome-banner");

    if (banner) {

        banner.animate(

            [

                {
                    opacity: 0,
                    transform: "translateY(-30px)"
                },

                {
                    opacity: 1,
                    transform: "translateY(0)"
                }

            ],

            {

                duration: 700,

                easing: "ease-out"

            }

        );

    }

    /* ==========================
       Live Clock
    ========================== */

    const clock = document.getElementById("liveClock");

    if (clock) {

        const updateClock = () => {

            clock.innerText =
                new Date().toLocaleTimeString(
                    "en-IN"
                );

        };

        updateClock();

        setInterval(updateClock, 1000);

    }

    /* ==========================
       Confirm Logout
    ========================== */

    const logout = document.querySelectorAll('a[href="/logout"]');

    if (logout.length) {

        logout.forEach(link => link.addEventListener("click", function (e) {

            const confirmLogout = confirm(

                "Are you sure you want to logout?"

            );

            if (!confirmLogout) {

                e.preventDefault();

            }

        }));

    }

});
