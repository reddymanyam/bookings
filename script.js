// Declare global variable for lead_id
let lead_id = null;
const clearButton = document.getElementById('clearButton');

// Function to check for leads based on mobile number and email
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
        console.log("result:", result);

        // Hide loader after receiving the response
        hideLoader();

        if (result.includes("No leads found")) {
            showModal("No Lead Found", `<button class="btn btn-active w-32" onclick="createLead()">Create Lead</button>`);
        } else {
            // Assign lead ID to global variable
            lead_id = result[0].name;
            showModal("Lead Found", `<p class="text-lg font-semibold">Lead ID: ${lead_id}</p>`);

            // Add lead ID to the select element and make it the selected option
            updateLeadIdDropdown(lead_id);
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

// Function to close the modal and show/hide other UI elements
function closeModal() {
    const modal = document.getElementById("my_modal_checkLeads");
    if (modal) modal.close();

    const secondGroup = document.getElementById("secondgroup");
    if (secondGroup) secondGroup.style.display = "grid";

    const submitButton = document.getElementById("submitButton");
    if (submitButton) submitButton.style.display = "block";

    const checkoutButton = document.getElementById("checkOutButton");
    if (checkoutButton) checkoutButton.style.display = "none";
}

// Function to create a new lead if none exists
async function createLead() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    const email = document.getElementById("externalclientemail").value.trim();

    if (!mobileNo || !email) {
        alert("Mobile number and email are required to create a lead.");
        return;
    }

    // Show loader
    showLoader();

    try {
        const response = await frappe.call({
            method: "novelite.api.bookings_api.external_client_booking.create_new_lead",
            args: { mobile_no: mobileNo, email: email },
        });

        const result = response.message;
        console.log("Created lead:", result);

        if (result) {
            // Assign the new lead ID to global variable
            lead_id = result.name;

            // Update the Lead ID dropdown with the new lead ID
            updateLeadIdDropdown(lead_id);

            // Show the lead creation confirmation in the modal
            showModal("Lead Created", `<p class="text-lg font-semibold">New Lead ID: ${lead_id}</p>`);
        }

    } catch (error) {
        console.error("API Error:", error);
        alert("An error occurred while creating a new lead.");
    } finally {
        // Hide loader after lead creation
        hideLoader();
    }
}

// Helper function to update Lead ID dropdown
function updateLeadIdDropdown(newLeadId) {
    const leadIdSelect = document.getElementById("lead_id");
    if (leadIdSelect) {
        // Clear any previous options
        leadIdSelect.innerHTML = "";

        // Create and add the new option
        const newOption = document.createElement("option");
        newOption.value = newLeadId;
        newOption.text = newLeadId;
        newOption.selected = true; // Set as selected by default
        leadIdSelect.appendChild(newOption);
    }
}


// Fetch form data for customer, location, room type, etc.
function fetchFormData(doctype, field, filters = []) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters, // Pass filters dynamically
        },
        callback: function (response) {
            if (doctype === 'Property Location' || doctype === 'Room Type') {
                const selectElement = document.getElementById(doctype === 'Property Location' ? 'location' : 'room_type');
                selectElement.innerHTML = ''; // Clear previous options
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    selectElement.appendChild(option);
                });
            } else if (doctype === 'Rooms') {
                const roomSelectElement = document.getElementById('room');
                roomSelectElement.innerHTML = ''; // Clear previous room options

                if (response.message.length === 0) {
                    roomSelectElement.innerHTML = '<option value="">No rooms found</option>';
                } else {
                    response.message.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item[field];
                        option.textContent = item[field];
                        roomSelectElement.appendChild(option);
                    });
                }
            }
        }
    });
}


// Function to fetch the price based on location and room type
function fetchPrice(location, roomType) {

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: 'Room Locations',
            filters: [
                ['name', '=', location],
            ]
        },
        callback: function (response) {
            const priceObj = response.message.room_type_details.find((room) => {
                return room.room_type === roomType ? room.price_per_hour : null;
            });
            const roomPrice = priceObj ? priceObj.price_per_hour : 0;
            document.getElementById('price_per_hour').innerHTML = roomPrice;
        }
    });
}

// Fetch static data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchFormData('Property Location', 'name'); // No suggestions needed
    fetchFormData('Room Type', 'name'); // No suggestions needed
});

// Event listener for location and room type changes to fetch rooms based on filters
document.getElementById('location').addEventListener('change', function () {
    const selectedLocation = this.value;
    const selectedRoomType = document.getElementById('room_type').value;
    fetchRooms(selectedLocation, selectedRoomType);
});

document.getElementById('room_type').addEventListener('change', function () {
    const selectedLocation = document.getElementById('location').value;
    const selectedRoomType = this.value;
    fetchRooms(selectedLocation, selectedRoomType);
    fetchPrice(selectedLocation, selectedRoomType); // Fetch price dynamically
});

// Function to fetch rooms based on selected location and room type
function fetchRooms(location, roomType) {
    const filters = [['location', '=', location]];
    if (roomType) {
        filters.push(['room_type', '=', roomType]);
    }
    fetchFormData('Rooms', 'room_name', filters); // Pass filters dynamically
}


clearButton.style.visibility = 'hidden'

// Fetch booked slots based on the selected filters
async function fetchBookedSlots(location, roomType, room, dates) {

    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Room Booking slot",
                fields: ['booking_time'],
                filters: [
                    ['location', '=', location],
                    ['room_type', '=', roomType],
                    ['room', '=', location + ' - ' + room],
                    ['booking_date', '=', dates],
                    ['status', '=', 'Approved']
                ]
            },
            callback: function (response) {
                if (response.message) {
                    // Parse each booked slot's time from string into an array and flatten it
                    const bookedSlots = response.message
                        .map(slot => JSON.parse(slot.booking_time)) // Parse the string
                        .flat(); // Flatten the arrays into a single array of time strings

                    // Remove duplicates using Set
                    const uniqueBookedSlots = [...new Set(bookedSlots)];
                    resolve(uniqueBookedSlots);
                } else {
                    resolve([]); // No booked slots found
                }
            },
            error: function (err) {
                console.error("Error fetching booked slots:", err);
                reject(err);
            }
        });
    });
}

// Generate new time slots and disable booked ones
async function generateNewTimeSlots(date) {
    const location = document.getElementById('location').value;
    const roomType = document.getElementById('room_type').value;
    const room = document.getElementById('room').value;
    const selectedDate = document.getElementById('booking_date').value;

    // Clear existing slots
    newSlotsContainer.innerHTML = '';

    // Fetch booked slots for the selected date
    const bookedSlots = await fetchBookedSlots(location, roomType, room, selectedDate);

    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:30:00`);

    let start = (new Date(date).toDateString() === currentDate.toDateString()) ?
        new Date(currentTime) : startOfDay;

    // Adjust start time for the current day to the next available slot
    if (start.getMinutes() >= 30) {
        start.setMinutes(0);
        start.setHours(start.getHours() + 1);
    } else if (start.getMinutes() > 0) {
        start.setMinutes(30);
    } else {
        start.setMinutes(0); // Start at the top of the hour
    }

    // Exit early if the selected time is beyond the available slots
    if (start > endOfDay) return;

    // First selected slot for range selection
    let firstSelectedSlot = null;

    // Calculate total price based on selected slots
    function calculateTotalPrice() {
        return (roomPrice / 2) * getSelectedSlots().length;
    }

    // Retrieve selected slots from DOM
    function getSelectedSlots() {
        return Array.from(newSlotsContainer.getElementsByClassName('selected'));
    }

    // Iterate over possible slots for the selected day
    while (start <= endOfDay) {
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        const timeSlot = `${hours}:${minutes}`;

        let slotElement = document.createElement('div');
        slotElement.classList.add('time-slot');
        slotElement.textContent = timeSlot;

        // Mark as disabled if already booked
        if (bookedSlots.includes(timeSlot)) {
            slotElement.classList.add('disabled');
            slotElement.style.backgroundColor = '#999999b8';
            slotElement.style.color = 'white';
            slotElement.style.cursor = 'not-allowed';
        } else {
            // Handle click event for available slots
            slotElement.addEventListener('click', () => {
                if (!firstSelectedSlot) {
                    // First slot selection
                    firstSelectedSlot = slotElement;
                    slotElement.classList.add('selected');
                    slotElement.style.backgroundColor = '#4caf50';
                } else {
                    // Second slot selection: if it's earlier than the first selected slot, swap them
                    let startTime = new Date(`1970-01-01T${firstSelectedSlot.textContent}:00`);
                    let endTime = new Date(`1970-01-01T${timeSlot}:00`);

                    if (endTime < startTime) {
                        // Swap the slots
                        [firstSelectedSlot, slotElement] = [slotElement, firstSelectedSlot];
                        [startTime, endTime] = [endTime, startTime]; // Adjust times accordingly
                    }

                    // Check if any booked slots are in between
                    let currentSlot = firstSelectedSlot;
                    let bookedInBetween = false;
                    while (currentSlot !== slotElement) {
                        if (bookedSlots.includes(currentSlot.textContent)) {
                            bookedInBetween = true;
                            break;
                        }
                        currentSlot = currentSlot.nextElementSibling;
                    }

                    // If a booked slot is found in between, show an alert
                    if (bookedInBetween) {
                        alert('Some slots are already booked in between. Please select a different range.');
                        return; // Exit the function if an alert is shown
                    }

                    // Select slots between first and current slot
                    currentSlot = firstSelectedSlot;
                    while (currentSlot !== slotElement) {
                        currentSlot.classList.add('selected');
                        currentSlot.style.backgroundColor = '#4caf50';
                        currentSlot = currentSlot.nextElementSibling;
                    }
                    slotElement.classList.add('selected');
                    slotElement.style.backgroundColor = '#4caf50';
                }

                // Conditionally show or hide the clear button
                const selectedSlots = getSelectedSlots();
                clearButton.style.visibility = selectedSlots.length > 0 ? 'visible' : 'hidden';
            });
        }

        // Append the time slot to the container
        newSlotsContainer.appendChild(slotElement);

        // Increment time by 30 minutes for the next slot
        start.setMinutes(start.getMinutes() + 30);
    }

    // Clear button functionality
    clearButton.addEventListener('click', () => {
        const selectedSlots = getSelectedSlots();
        selectedSlots.forEach(slot => {
            slot.classList.remove('selected');
            slot.style.backgroundColor = ''; // Remove background color
        });

        firstSelectedSlot = null; // Reset first selected slot
        clearButton.style.visibility = 'hidden';
    });
}

// Call generateNewTimeSlots on date change
const bookingDateInput = document.getElementById('booking_date');
const newSlotsContainer = document.getElementById('newSlotsContainer');

bookingDateInput.addEventListener('change', function () {
    const selectedDate = new Date(this.value); // selected date from input
    const currentDate = new Date(); // current date and time

    // Set the time of selectedDate to the current time
    selectedDate.setHours(currentDate.getHours());
    selectedDate.setMinutes(currentDate.getMinutes());
    selectedDate.setSeconds(currentDate.getSeconds());
    selectedDate.setMilliseconds(currentDate.getMilliseconds());

    if (selectedDate < currentDate) {
        // Reset date to current date
        const currentDateString = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        bookingDateInput.value = currentDateString;
        generateNewTimeSlots(currentDateString);
        alert("Can't select previous date");
    } else {
        // Generate new time slots for the selected date
        generateNewTimeSlots(this.value);
    }
});



// Loader control functions
function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}
