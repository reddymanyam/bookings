// Declare global variable for lead_id
let lead_id = null;

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
 
        //........................................... create_new_lead ...............................//

        const result = response.message;
        console.log("result:", result);

        // Hide loader after receiving the response
        hideLoader();

        if ( result.includes("No leads found")) {
            showModal("No Lead Found", `<button class="btn btn-active w-32" onclick="createLead()">Create Lead</button>`);
        } else {
            // Assign lead ID to global variable
            lead_id = result[0].name;
            showModal("Lead Found", `<p class="text-lg font-semibold">Lead ID: ${lead_id}</p>`);

            // Add lead ID to the select element
            const leadIdOption = document.getElementById("lead_id");
            if (leadIdOption) {
                const newOption = document.createElement("option");
                newOption.value = lead_id;
                newOption.text = lead_id;
                leadIdOption.appendChild(newOption);
            }
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
    console.log("clicked");

    const secondGroup = document.getElementById("secondgroup");
    if (secondGroup) secondGroup.style.display = "grid";

    const submitButton = document.getElementById("submitButton");
    if (submitButton) submitButton.style.display = "block";

    const checkoutButton = document.getElementById("checkOutButton");
    if (checkoutButton) checkoutButton.style.display = "none";
}

// Placeholder function for lead creation
function createLead() {
    if (lead_id) {
        alert(`Creating lead with ID: ${lead_id}`);
        // Add further logic for creating lead if needed
    } else {
        alert("No lead ID available to create.");
    }
    closeModal();
}

// Loader control functions
function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}
