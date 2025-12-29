document.addEventListener("DOMContentLoaded", function () {
  // Bootstrap form validation
  (() => {
    "use strict";
    const forms = document.querySelectorAll(".needs-validation");

    Array.from(forms).forEach((form) => {
      form.addEventListener(
        "submit",
        (event) => {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add("was-validated");
        },
        false
      );
    });
  })();

  // Tax switch functionality
  let taxSwitch = document.getElementById("switchCheckDefault");

  if (taxSwitch) {
    // Null check bhi add kar do
    taxSwitch.addEventListener("click", () => {
      let taxInfo = document.getElementsByClassName("tax-info");
      for (let info of taxInfo) {
        // 'let' add karo
        if (info.style.display != "inline") {
          info.style.display = "inline";
        } else {
          info.style.display = "none";
        }
      }
    });
  }
});
