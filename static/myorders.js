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

document.addEventListener("DOMContentLoaded", function() {
    const ordersList = document.getElementById('orders-list');
    const loadingDiv = document.getElementById('loading');
    const noOrdersDiv = document.getElementById('no-orders');

    fetch('/api/orders')
        .then(response => response.json())
        .then(orders => {
            loadingDiv.style.display = 'none';
            if (orders.length === 0) {
                noOrdersDiv.style.display = 'block';
                return;
            }
            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.innerHTML = `
                    <div class="order-image"><img src="${order.image_url}" alt="${order.product_name}"></div>
                    <div class="order-details">
                        <h3 class="product-name">${order.product_name}</h3>
                        <p class="order-date"><i class="far fa-calendar-alt"></i> ${order.date}</p>
                        <p class="order-price">₹${order.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div class="order-status-wrapper">
                        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        <button class="btn-track">View Details</button>
                    </div>`;
                ordersList.appendChild(orderCard);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            loadingDiv.innerHTML = "<p>Error loading orders.</p>";
        });
});