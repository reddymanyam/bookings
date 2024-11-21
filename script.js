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
            showModal("No Lead Found", `<button class="btn btn-active w-32" onclick="createLead()">Create Lead</button>`);
        } else {
            showModal("Lead Found", `<p class="text-lg font-semibold">Lead ID: ${result.lead_id}</p>`);
        }
    } catch (error) {
        console.error("API Error:", error);
        alert("An error occurred while checking leads.");

        // Hide loader if an error occurs
        hideLoader();
    }
}

// Function to show the modal with dynamic content
function showModal(title, content) {
    const modal = document.getElementById("my_modal_checkLeads");
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogContent").innerHTML = content;
    if (modal) modal.showModal();
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("my_modal_checkLeads");
    if (modal) modal.close();
}

// Placeholder function for lead creation
function createLead() {
    alert("Create Lead functionality to be implemented.");
    closeModal();
}

// Loader control functions
function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}
