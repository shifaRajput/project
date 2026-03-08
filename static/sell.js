const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const form = document.getElementById("sellForm");
const submitBtn = document.getElementById("submitBtn");
const emailInput = document.getElementById("userEmail");
const nameInput = document.getElementById("userName");
const phoneInput = document.getElementById("phone");

// Listen for when the user clicks out of the email box
emailInput.addEventListener("blur", async function() {
    const email = this.value.trim();
    if (!email) return;

    try {
        const response = await fetch("/api/get-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        const result = await response.json();

        if (result.status === "success") {
            // User found! Auto-fill the boxes and make them read-only
            nameInput.value = result.name;
            phoneInput.value = result.phone;
            nameInput.readOnly = true;
            phoneInput.readOnly = true;
        } else {
            // User not found - SHOW OUR CUSTOM POPUP INSTEAD OF THE ALERT
            document.getElementById("customModal").style.display = "flex";
            
            // Clear the boxes and keep them editable just in case
            nameInput.value = "";
            phoneInput.value = "";
            nameInput.readOnly = false;
            phoneInput.readOnly = false;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});

fileInput.addEventListener("change", function() {
    imagePreview.innerHTML = "";
    const files = Array.from(this.files);
    if (files.length > 5) { alert("Max 5 photos allowed."); this.value = ""; return; }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style = "width:70px;height:70px;object-fit:cover;border-radius:10px;margin-top:10px;border:2px solid #6366f1;";
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (fileInput.files.length < 1) { alert("Please upload at least 1 photo."); return; }

    submitBtn.classList.add("loading");
    const formData = new FormData(form);
    const response = await fetch("/api/sell-device", { method: "POST", body: formData });
    const result = await response.json();

    if (result.status === "success") {
        // Plug the ID into the HTML and show the modal
        document.getElementById("successRequestId").innerText = result.id;
        document.getElementById("successModal").style.display = "flex";
        
        // Clear the form
        form.reset(); 
        imagePreview.innerHTML = "";
        nameInput.value = "";
        phoneInput.value = "";
        nameInput.readOnly = false;
        phoneInput.readOnly = false;
    }
    submitBtn.classList.remove("loading");
});

// Function to hide the modal when 'Try Again' is clicked
function closeModal() {
    document.getElementById("customModal").style.display = "none";
}
// Function to hide the success modal
function closeSuccessModal() {
    document.getElementById("successModal").style.display = "none";
    // Optional: You can redirect them to the home page by uncommenting the line below
    // window.location.href = "/";
}