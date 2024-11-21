frappe.ready(function() {
    
})
   
// Function to show the loader
function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

// Function to hide the loader
function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}

// Updated function to handle API call and modal display
async function checkLeads() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    const email = document.getElementById("externalclientemail").value.trim();

    if (!mobileNo || !email) {
        alert("Please fill in both Mobile Number and Email.");
        return;
    }

    // Show loader
    showLoader();

    try {
        const response = await frappe.call({
            method: "novelite.api.bookings_api.external_client_booking.check_in_leads",
            args: { mobile_no: mobileNo, email: email },
        });

        const result = response.message;
        console.log("API Response:", result);

        // Hide loader after receiving the response
        hideLoader();

        if (!result || result.status === "no_lead_found") {
            showModal();
        } else {
            showModal();
        }
    } catch (error) {
        console.error("API Error:", error);
        alert("An error occurred while checking leads.");

        // Hide loader if an error occurs
        hideLoader();
    }
}

// Show the modal
function showModal() {
    const modal = document.getElementById("my_modal_checkLeads");
    if (modal) modal.showModal();
}

// Close the modal
function closeModal() {
    const modal = document.getElementById("my_modal_checkLeads");
    if (modal) modal.close();
}

// Placeholder function for lead creation
function createLead() {
    alert("Create Lead functionality to be implemented.");
    closeModal();
}
