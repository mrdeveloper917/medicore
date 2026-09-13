/* =========================================================
   DOCTOR PROFILE JAVASCRIPT
   Clean & Stable Version
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("Doctor Profile JS Loaded");

  /* =====================================================
     COMMON ELEMENTS
     ===================================================== */

  const profileForm = document.getElementById("doctorProfileForm");

  const profileInput =
    document.getElementById("profileImageInput");

  const coverInput =
    document.getElementById("coverImageInput");

  const profileImage =
    document.querySelector(".doctor-avatar");

  const coverImage =
    document.querySelector(".cover-image img");


  /* =====================================================
     TOAST FUNCTION
     ===================================================== */

  window.showProfileToast = function (
    message,
    type = "success"
  ) {

    const oldToast =
      document.querySelector(".profile-toast");

    if (oldToast) {
      oldToast.remove();
    }

    const toast =
      document.createElement("div");

    toast.className = "profile-toast";

    if (type === "error") {
      toast.classList.add("error");
    }

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("show");
    }, 50);

    setTimeout(function () {

      toast.classList.remove("show");

      setTimeout(function () {
        toast.remove();
      }, 300);

    }, 2500);
  };


  /* =====================================================
     PROFILE IMAGE PREVIEW
     ===================================================== */

  if (profileInput && profileImage) {

    profileInput.addEventListener(
      "change",
      function () {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

          showProfileToast(
            "Please select a valid image.",
            "error"
          );

          this.value = "";
          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          function (event) {

            profileImage.src =
              event.target.result;
          };

        reader.readAsDataURL(file);
      }
    );
  }


  /* =====================================================
     COVER IMAGE PREVIEW
     ===================================================== */

  if (coverInput && coverImage) {

    coverInput.addEventListener(
      "change",
      function () {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

          showProfileToast(
            "Please select a valid cover image.",
            "error"
          );

          this.value = "";
          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          function (event) {

            coverImage.src =
              event.target.result;
          };

        reader.readAsDataURL(file);
      }
    );
  }


  /* =====================================================
     PROFILE IMAGE HOVER
     ===================================================== */

  if (profileImage) {

    profileImage.addEventListener(
      "mouseenter",
      function () {

        this.style.transition =
          "transform .3s ease";

        this.style.transform =
          "scale(1.05)";
      }
    );

    profileImage.addEventListener(
      "mouseleave",
      function () {

        this.style.transform =
          "scale(1)";
      }
    );
  }


  /* =====================================================
     PROFILE IMAGE ZOOM
     ===================================================== */

  if (profileImage) {

    profileImage.addEventListener(
      "click",
      function () {

        const overlay =
          document.createElement("div");

        overlay.className =
          "image-preview";

        const image =
          document.createElement("img");

        image.src = profileImage.src;

        image.alt =
          "Doctor Profile Image";

        overlay.appendChild(image);

        document.body.appendChild(
          overlay
        );

        overlay.addEventListener(
          "click",
          function () {
            overlay.remove();
          }
        );
      }
    );
  }


  /* =====================================================
     STATISTICS COUNTER
     ===================================================== */

  const counters =
    document.querySelectorAll(
      ".profile-stat-card h2"
    );

  counters.forEach(function (counter) {

    const originalText =
      counter.textContent.trim();

    const number =
      originalText.replace(/[^\d]/g, "");

    const target =
      parseInt(number, 10);

    if (isNaN(target)) return;

    let count = 0;

    const step =
      Math.max(
        1,
        Math.ceil(target / 80)
      );

    function updateCounter() {

      count += step;

      if (count >= target) {
        count = target;
      } else {
        requestAnimationFrame(
          updateCounter
        );
      }

      if (originalText.includes("₹")) {

        counter.textContent =
          "₹ " + count;

      } else if (
        originalText.includes("+")
      ) {

        counter.textContent =
          count + "+";

      } else {

        counter.textContent =
          count;
      }
    }

    updateCounter();
  });


  /* =====================================================
     PROFILE COMPLETION CIRCLE
     ===================================================== */

  const completion =
    document.querySelector(
      ".completion-circle"
    );

  if (completion) {

    const span =
      completion.querySelector("span");

    if (span) {

      const value =
        parseInt(
          span.textContent
            .replace("%", ""),
          10
        );

      if (!isNaN(value)) {

        let degree = 0;

        completion.style.background =
          "conic-gradient(#2563eb 0deg, #e5e7eb 0deg)";

        const timer =
          setInterval(function () {

            degree += 4;

            if (
              degree >=
              value * 3.6
            ) {
              degree =
                value * 3.6;

              clearInterval(timer);
            }

            completion.style.background =
              `conic-gradient(
                                #2563eb ${degree}deg,
                                #e5e7eb ${degree}deg
                            )`;

          }, 12);
      }
    }
  }


  /* =====================================================
     PAGE LOAD CARD ANIMATION
     ===================================================== */

  const cards =
    document.querySelectorAll(
      ".profile-card, .profile-stat-card"
    );

  cards.forEach(function (
    card,
    index
  ) {

    card.style.opacity = "0";

    card.style.transform =
      "translateY(25px)";

    setTimeout(function () {

      card.style.transition =
        "opacity .5s ease, transform .5s ease";

      card.style.opacity = "1";

      card.style.transform =
        "translateY(0)";

    }, index * 100);
  });


  /* =====================================================
     RATING STAR ANIMATION
     ===================================================== */

  const stars =
    document.querySelectorAll(
      ".doctor-rating i"
    );

  stars.forEach(function (
    star,
    index
  ) {

    star.style.opacity = "0";

    star.style.transform =
      "scale(.4)";

    setTimeout(function () {

      star.style.transition =
        "opacity .4s ease, transform .4s ease";

      star.style.opacity = "1";

      star.style.transform =
        "scale(1)";

    }, index * 120);
  });


  /* =====================================================
     COPY REGISTRATION NUMBER
     ===================================================== */

  const registrationField =
    document.querySelector(
      ".registration-number"
    );

  if (registrationField) {

    registrationField.style.cursor =
      "pointer";

    registrationField.addEventListener(
      "click",
      async function () {

        const value =
          registrationField.textContent
            .trim();

        if (!value) return;

        try {

          await navigator.clipboard
            .writeText(value);

          showProfileToast(
            "Registration Number Copied!",
            "success"
          );

        } catch (error) {

          console.error(
            "Clipboard Error:",
            error
          );

          showProfileToast(
            "Failed to copy Registration Number!",
            "error"
          );
        }
      }
    );
  }


  /* =====================================================
     CERTIFICATE IMAGE PREVIEW
     ===================================================== */

  const certificateImages =
    document.querySelectorAll(
      ".certificate-card img"
    );

  certificateImages.forEach(function (image) {

    image.style.cursor =
      "zoom-in";

    image.addEventListener(
      "click",
      function (event) {

        /*
         * Only handle image click.
         * Do NOT prevent anchor navigation.
         */

        event.stopPropagation();

        const modal =
          document.createElement("div");

        modal.className =
          "certificate-modal";

        const content =
          document.createElement("div");

        content.className =
          "certificate-modal-content";

        const preview =
          document.createElement("img");

        preview.src =
          image.src;

        preview.alt =
          "Certificate Preview";

        const closeButton =
          document.createElement("button");

        closeButton.className =
          "close-modal";

        closeButton.type =
          "button";

        closeButton.textContent =
          "✕";

        content.appendChild(
          preview
        );

        content.appendChild(
          closeButton
        );

        modal.appendChild(
          content
        );

        document.body.appendChild(
          modal
        );

        closeButton.addEventListener(
          "click",
          function (e) {

            e.stopPropagation();

            modal.remove();
          }
        );

        modal.addEventListener(
          "click",
          function (e) {

            if (
              e.target === modal
            ) {
              modal.remove();
            }
          }
        );
      }
    );
  });


  /* =====================================================
     SOCIAL LINKS
     ===================================================== */

  document
    .querySelectorAll(
      ".social-links a"
    )
    .forEach(function (link) {

      link.addEventListener(
        "click",
        function (event) {

          const url =
            link.getAttribute(
              "href"
            );

          if (
            !url ||
            url === "#"
          ) {

            event.preventDefault();

            showProfileToast(
              "Social Link Not Available",
              "error"
            );
          }

          /*
           * IMPORTANT:
           * Real links are NOT blocked.
           */
        }
      );
    });


  /* =====================================================
     BIOGRAPHY READ MORE / LESS
     ===================================================== */

  const bio =
    document.querySelector(
      ".about-doctor p"
    );

  if (
    bio &&
    bio.textContent.length > 180
  ) {

    const fullText =
      bio.textContent.trim();

    const shortText =
      fullText.substring(
        0,
        180
      ) + "...";

    bio.textContent =
      shortText;

    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "read-more-btn";

    button.textContent =
      "Read More";

    bio.after(button);

    let expanded = false;

    button.addEventListener(
      "click",
      function () {

        expanded =
          !expanded;

        if (expanded) {

          bio.textContent =
            fullText;

          button.textContent =
            "Read Less";

        } else {

          bio.textContent =
            shortText;

          button.textContent =
            "Read More";
        }
      }
    );
  }


  /* =====================================================
     DARK MODE
     ===================================================== */

  const darkToggle =
    document.querySelector(
      ".dark-mode-btn"
    );

  if (darkToggle) {

    if (
      localStorage.getItem(
        "doctorTheme"
      ) === "dark"
    ) {

      document.body.classList.add(
        "dark"
      );

      darkToggle.innerHTML =
        '<i class="fa-solid fa-sun"></i>';
    }

    darkToggle.addEventListener(
      "click",
      function () {

        document.body.classList.toggle(
          "dark"
        );

        if (
          document.body.classList.contains(
            "dark"
          )
        ) {

          localStorage.setItem(
            "doctorTheme",
            "dark"
          );

          darkToggle.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

          showProfileToast(
            "Dark Mode Enabled"
          );

        } else {

          localStorage.setItem(
            "doctorTheme",
            "light"
          );

          darkToggle.innerHTML =
            '<i class="fa-solid fa-moon"></i>';

          showProfileToast(
            "Light Mode Enabled"
          );
        }
      }
    );
  }


  /* =====================================================
     AUTO SAVE PROFILE FORM
     ===================================================== */

  if (profileForm) {

    const fields =
      profileForm.querySelectorAll(
        "input:not([type='file']), textarea, select"
      );

    fields.forEach(function (field) {

      if (!field.name) return;

      const key =
        "profile_" +
        field.name;

      const saved =
        localStorage.getItem(key);

      /*
       * Only restore if the field
       * is currently empty.
       */

      if (
        saved !== null &&
        field.value === ""
      ) {

        field.value =
          saved;
      }

      field.addEventListener(
        "input",
        function () {

          localStorage.setItem(
            key,
            field.value
          );
        }
      );

      field.addEventListener(
        "change",
        function () {

          localStorage.setItem(
            key,
            field.value
          );
        }
      );
    });


    profileForm.addEventListener(
      "submit",
      function () {

        fields.forEach(
          function (field) {

            if (!field.name)
              return;

            localStorage.removeItem(
              "profile_" +
              field.name
            );
          }
        );
      }
    );
  }


  /* =====================================================
     PROFILE STRENGTH
     ===================================================== */

  if (profileForm) {

    const requiredFields = [
      "name",
      "email",
      "phone",
      "qualification",
      "specialization",
      "registrationNumber",
      "bio"
    ];

    const strengthBar =
      document.querySelector(
        ".profile-strength-fill"
      );

    const strengthText =
      document.querySelector(
        ".profile-strength-value"
      );

    function updateProfileStrength() {

      let completed = 0;

      requiredFields.forEach(
        function (fieldName) {

          const input =
            profileForm.querySelector(
              `[name="${fieldName}"]`
            );

          if (
            input &&
            input.value.trim() !== ""
          ) {
            completed++;
          }
        }
      );

      const percent =
        Math.round(
          (
            completed /
            requiredFields.length
          ) * 100
        );

      if (strengthBar) {

        strengthBar.style.width =
          percent + "%";
      }

      if (strengthText) {

        strengthText.textContent =
          percent + "%";
      }
    }

    profileForm
      .querySelectorAll(
        "input, textarea, select"
      )
      .forEach(function (input) {

        input.addEventListener(
          "input",
          updateProfileStrength
        );

        input.addEventListener(
          "change",
          updateProfileStrength
        );
      });

    updateProfileStrength();
  }


  /* =====================================================
     BIO CHARACTER COUNTER
     ===================================================== */

  const bioField =
    document.querySelector(
      'textarea[name="bio"]'
    );

  if (bioField) {

    const counter =
      document.createElement(
        "small"
      );

    counter.className =
      "bio-counter";

    bioField.after(counter);

    function updateBioCounter() {

      counter.textContent =
        `${bioField.value.length}/1000`;
    }

    bioField.addEventListener(
      "input",
      updateBioCounter
    );

    updateBioCounter();
  }


  /* =====================================================
     PHONE VALIDATION
     ===================================================== */

  const phone =
    document.querySelector(
      'input[name="phone"]'
    );

  if (phone) {

    phone.addEventListener(
      "blur",
      function () {

        const regex =
          /^[6-9]\d{9}$/;

        if (
          phone.value &&
          !regex.test(
            phone.value.trim()
          )
        ) {

          phone.classList.add(
            "invalid"
          );

          showProfileToast(
            "Invalid Phone Number",
            "error"
          );

        } else {

          phone.classList.remove(
            "invalid"
          );
        }
      }
    );
  }


  /* =====================================================
     EMAIL VALIDATION
     ===================================================== */

  const email =
    document.querySelector(
      'input[name="email"]'
    );

  if (email) {

    email.addEventListener(
      "blur",
      function () {

        const regex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          email.value &&
          !regex.test(
            email.value.trim()
          )
        ) {

          email.classList.add(
            "invalid"
          );

          showProfileToast(
            "Invalid Email",
            "error"
          );

        } else {

          email.classList.remove(
            "invalid"
          );
        }
      }
    );
  }


  /* =====================================================
     UNSAVED CHANGES WARNING
     ===================================================== */

  let profileChanged =
    false;

  if (profileForm) {

    const editableFields =
      profileForm.querySelectorAll(
        "input, textarea, select"
      );

    editableFields.forEach(
      function (input) {

        input.addEventListener(
          "input",
          function () {

            profileChanged =
              true;
          }
        );

        input.addEventListener(
          "change",
          function () {

            profileChanged =
              true;
          }
        );
      }
    );

    profileForm.addEventListener(
      "submit",
      function () {

        profileChanged =
          false;
      }
    );

    /*
     * Only show browser warning when
     * the actual profile form has changes.
     *
     * No global loader is created here.
     */

    window.addEventListener(
      "beforeunload",
      function (event) {

        if (!profileChanged)
          return;

        event.preventDefault();

        event.returnValue = "";
      }
    );
  }


  /* =====================================================
     SAVE STATUS
     ===================================================== */

  if (profileForm) {

    const existingStatus =
      profileForm.querySelector(
        ".save-status"
      );

    const status =
      existingStatus ||
      document.createElement(
        "div"
      );

    if (!existingStatus) {

      status.className =
        "save-status";

      status.textContent =
        "Saved";

      profileForm.prepend(
        status
      );
    }

    const fields =
      profileForm.querySelectorAll(
        "input, textarea, select"
      );

    fields.forEach(function (input) {

      input.addEventListener(
        "input",
        function () {

          status.textContent =
            "Saving...";

          clearTimeout(
            input._saveTimer
          );

          input._saveTimer =
            setTimeout(
              function () {

                status.textContent =
                  "Saved";

              },
              800
            );
        }
      );
    });
  }


  /* =====================================================
     REQUIRED FIELD VALIDATION
     ===================================================== */

  if (profileForm) {

    profileForm
      .querySelectorAll(
        "input[required], textarea[required], select[required]"
      )
      .forEach(function (input) {

        input.addEventListener(
          "input",
          function () {

            if (
              input.value.trim() === ""
            ) {

              input.classList.add(
                "invalid"
              );

            } else {

              input.classList.remove(
                "invalid"
              );
            }
          }
        );
      });
  }


  /* =====================================================
     KEYBOARD SHORTCUTS
     ===================================================== */

  document.addEventListener(
    "keydown",
    function (event) {

      /*
       * Don't trigger shortcuts while
       * typing inside form fields.
       */

      const tag =
        event.target.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return;
      }

      if (
        event.altKey &&
        event.key.toLowerCase() === "e"
      ) {

        window.location.href =
          "/doctor/profile/edit";
      }

      if (
        event.altKey &&
        event.key.toLowerCase() === "d"
      ) {

        window.location.href =
          "/doctor/dashboard";
      }

      if (
        event.altKey &&
        event.key.toLowerCase() === "h"
      ) {

        window.location.href =
          "/";
      }
    }
  );


  /* =====================================================
     PROFILE NOTIFICATION
     ===================================================== */

  const profileNotification =
    document.querySelector(
      ".profile-notification"
    );

  if (profileNotification) {

    profileNotification.addEventListener(
      "click",
      function () {

        showProfileToast(
          "You have no new notifications."
        );
      }
    );
  }


  /* =====================================================
     REFRESH MESSAGE
     ===================================================== */

  window.addEventListener(
    "load",
    function () {

      try {

        const navigation =
          performance.getEntriesByType(
            "navigation"
          )[0];

        if (
          navigation &&
          navigation.type === "reload"
        ) {

          /*
           * Keep this subtle.
           */

          console.log(
            "Doctor Profile Reloaded"
          );
        }

      } catch (error) {

        console.log(
          "Navigation API unavailable"
        );
      }
    }
  );


  /* =====================================================
     LAZY LOADING
     ===================================================== */

  const lazyImages =
    document.querySelectorAll(
      "img[data-src]"
    );

  if (
    lazyImages.length &&
    "IntersectionObserver" in window
  ) {

    const imageObserver =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(
            function (entry) {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              const img =
                entry.target;

              img.src =
                img.dataset.src;

              img.removeAttribute(
                "data-src"
              );

              imageObserver.unobserve(
                img
              );
            }
          );
        }
      );

    lazyImages.forEach(
      function (img) {

        imageObserver.observe(
          img
        );
      }
    );
  }


  /* =====================================================
     WELCOME MESSAGE
     ===================================================== */

  window.addEventListener(
    "load",
    function () {

      if (
        !sessionStorage.getItem(
          "doctorProfileWelcome"
        )
      ) {

        showProfileToast(
          "👋 Welcome to your Doctor Profile"
        );

        sessionStorage.setItem(
          "doctorProfileWelcome",
          "true"
        );
      }
    }
  );


  /* =====================================================
     NETWORK STATUS
     ===================================================== */

  window.addEventListener(
    "offline",
    function () {

      showProfileToast(
        "Internet Connection Lost",
        "error"
      );
    }
  );

  window.addEventListener(
    "online",
    function () {

      showProfileToast(
        "Internet Connected"
      );
    }
  );


  /* =====================================================
     PERFORMANCE LOG
     ===================================================== */

  window.addEventListener(
    "load",
    function () {

      console.log(
        "Doctor Profile Ready"
      );
    }
  );


  /* =====================================================
     ERROR HANDLER
     ===================================================== */

  window.addEventListener(
    "error",
    function (event) {

      console.error(
        "Doctor Profile Error:",
        event.message
      );
    }
  );


  /* =====================================================
     TAB VISIBILITY
     ===================================================== */

  document.addEventListener(
    "visibilitychange",
    function () {

      if (document.hidden) {

        console.log(
          "Doctor Profile Hidden"
        );

      } else {

        console.log(
          "Doctor Profile Visible"
        );
      }
    }
  );


  /* =====================================================
     DEBOUNCE
     ===================================================== */

  window.debounce =
    function (
      callback,
      delay = 300
    ) {

      let timer;

      return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(
          function () {

            callback.apply(
              this,
              args
            );

          },
          delay
        );
      };
    };


  console.log(
    "Doctor Profile JS Loaded Successfully"
  );

});