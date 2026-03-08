// navigation bar 
const navItems = document.querySelectorAll(".navbar-center li");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    // Check if the click was on an anchor tag or inside the li
    // We want the browser to follow the link, so we don't use e.preventDefault()
    
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// Add logic to set active class based on current URL on page load
// Add logic to set active class based on current URL on page load
window.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    
    // --- Desktop Navigation ---
    const desktopLinks = document.querySelectorAll(".navbar-center a");
    const desktopLis = document.querySelectorAll(".navbar-center li");
    
    desktopLinks.forEach(link => {
        // If the link matches the current Flask route
        if (link.getAttribute("href") === currentPath) {
            desktopLis.forEach(li => li.classList.remove("active"));
            link.parentElement.classList.add("active");
        }
    });

    // --- Mobile Bottom Navigation ---
    const mobileLinks = document.querySelectorAll(".mobile-bottom-nav a.nav-item");
    
    mobileLinks.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            mobileLinks.forEach(i => i.classList.remove("active"));
            link.classList.add("active");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {

  function updateTotal() {

    let subtotal = 0;

    document.querySelectorAll(".cart-item").forEach(function (item) {

      let price = parseInt(item.querySelector(".price").innerText.trim());
      let qty = parseInt(item.querySelector(".qty span").innerText.trim());

      subtotal += price * qty;

    });

    let delivery = parseInt(document.getElementById("delivery").innerText.trim());

    document.getElementById("subtotal").innerText = subtotal;
    document.getElementById("grandtotal").innerText = subtotal + delivery;
  }


  // PLUS
  document.querySelectorAll(".plus").forEach(function (btn) {

    btn.addEventListener("click", function () {

      let span = this.parentElement.querySelector("span");
      let current = parseInt(span.innerText);

      span.innerText = current + 1;

      updateTotal();
    });

  });


  // MINUS
  document.querySelectorAll(".minus").forEach(function (btn) {

    btn.addEventListener("click", function () {

      let span = this.parentElement.querySelector("span");
      let current = parseInt(span.innerText);

      if (current > 1) {
        span.innerText = current - 1;
        updateTotal();
      }

    });

  });


  // REMOVE (agar right side me remove button hai)
  document.querySelectorAll(".remove").forEach(function (btn) {

    btn.addEventListener("click", function () {

      this.closest(".cart-item").remove();
      updateTotal();

    });

  });


  // PAYMENT BUTTON
  let paymentBtn = document.getElementById("paymentBtn");

  if (paymentBtn) {
    paymentBtn.addEventListener("click", function () {
      window.location.href = "payment.html";
    });
  }


  updateTotal();

});