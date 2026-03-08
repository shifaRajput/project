// Change .back-btn to .back-link
document.querySelector(".back-link").addEventListener("click", () => {
    window.history.back();
});

document.addEventListener("DOMContentLoaded", function () {

    // Navigation active state
    const navItems = document.querySelectorAll(".navbar-center li");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // Admin tab switching
    const adminItems = document.querySelectorAll(".admin-nav-item");
    const adminSections = document.querySelectorAll(".admin-section");

    adminItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            adminItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            adminSections.forEach(section => section.classList.remove("active"));
            adminSections[index].classList.add("active");
        });
    });

    // DELETE CONFIRMATION
    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach(button => {
        button.addEventListener("click", function () {

            const productId = this.getAttribute("data-id");

            const confirmDelete = confirm("Are you sure you want to delete this product?");

            if (confirmDelete) {
                fetch("/admin/delete/" + productId, {
                    method: "POST"
                })
                .then(response => {
                    if (response.ok) {
                        window.location.reload();
                    }
                });
            }
        });
    });

});