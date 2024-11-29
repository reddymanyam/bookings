/**
 * Global variable for lead_id.
 * @type {string|null}
 */
let lead_id = null;

/**
 * Global variable for room price.
 * @type {number}
 */
let roomPrice = 0;

/**
 * Global variable for email.
 * @type {string|null}
 */
let email = null;

//DOM elements
const clearButton = document.getElementById('clearButton');
// Submit button
const submitBtn = document.getElementById('submitButton');
//Total price
const total_price = document.getElementById('total_price');

//Clear selection is hidden inititally
clearButton.style.visibility = 'hidden'

/**
 * Fetches booked slots for a given location, room type, room, and date.
 * @param {string} location - The location where the booking occurred.
 * @param {string} roomType - The type of room being booked.
 * @param {string} room - The room being booked.
 * @param {string} dates - The booking date.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of unique booked time slots.
 */
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

/**
 * Checks if a lead exists based on the provided mobile number and email.
 * Displays a modal if a lead is found or allows for creating a new lead.
 */
async function checkLeads() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    email = document.getElementById("externalclientemail").value.toLowerCase().trim();

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

/**
 * Shows a modal with dynamic content.
 * @param {string} title - The title to display in the modal.
 * @param {string} content - The HTML content to display inside the modal.
 */
function showModal(title, content) {
    const modal = document.getElementById("my_modal_checkLeads");
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogContent").innerHTML = content;
    if (modal) modal.showModal();
}

/**
 * Closes the modal and adjusts the visibility of UI elements.
 */
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

/**
 * Creates a new lead based on the mobile number and email if no lead exists.
 */
async function createLead() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    // const email = document.getElementById("externalclientemail").value.toLowerCase().trim();

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

/**
 * Updates the Lead ID dropdown with the new lead ID.
 * @param {string} newLeadId - The ID of the new lead to add to the dropdown.
 */
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

/**
 * Fetches data for a given doctype and field, and updates the relevant suggestions or dropdown elements.
 * @param {string} doctype - The type of document to fetch (e.g., 'Property Location', 'Room Type').
 * @param {string} field - The field to fetch (e.g., 'name', 'room_type').
 * @param {string} suggestionsElementId - The ID of the element to update with suggestions.
 * @param {Array<Object>} [filters=[]] - Optional filters for the query.
 */
function fetchFormData(doctype, field, suggestionsElementId, filters = []) {

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters,
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
            } else {
                const suggestionsElement = document.getElementById(suggestionsElementId);
                suggestionsElement.innerHTML = ''; // Clear previous suggestions
                response.message.forEach(item => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = item[field];

                    // Add click event to select the suggestion
                    suggestionItem.addEventListener('click', function () {
                        const inputField = doctype === 'Customer' ? 'customer' : 'email';
                        document.getElementById(inputField).value = item[field];
                        suggestionsElement.innerHTML = ''; // Clear suggestions after selection
                    });

                    suggestionsElement.appendChild(suggestionItem);
                });
            }
        }
    });
}

/**
 * Fetches the price of a room based on location and room type, then updates the displayed price.
 * @param {string} location - The location of the room.
 * @param {string} roomType - The type of room.
 */
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
            roomPrice = priceObj ? priceObj.price_per_hour : 0;
            document.getElementById('price_per_hour').innerHTML = roomPrice;
            total_price.innerHTML = (roomPrice / 2) * getSelectedSlots().length;
        }
    });
}

/**
 * Generates new time slots and disables booked ones based on the selected date.
 * @param {string} date - The selected date in 'YYYY-MM-DD' format to generate time slots for.
 */
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

    /**
     * Calculates the total price based on selected slots.
     * @returns {number} The total price for the selected slots.
     */
    function calculateTotalPrice() {
        return (roomPrice / 2) * getSelectedSlots().length;
    }

    /**
     * Retrieves the selected slots from the DOM.
     * @returns {Array} Array of selected slot elements.
     */
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

                // Update total price
                total_price.innerHTML = calculateTotalPrice();

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
        total_price.innerHTML = '0'; // Reset total price
        clearButton.style.visibility = 'hidden';
    });
}

/**
 * Event listener for the booking date change.
 * Fetches and generates new time slots based on the selected date.
 */
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

/**
 * Fetches static data (location, room type, rooms) on page load.
 * Sets up event listeners for location and room type filters.
 */
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
    fetchPrice(selectedLocation, selectedRoomType);
});

/**
 * Fetches rooms based on selected location and room type.
 * @param {string} location - The selected location.
 * @param {string} roomType - The selected room type.
 */
function fetchRooms(location, roomType) {
    const filters = [
        ['location', '=', location],
        ['room_type', '=', roomType]
    ];

    fetchFormData('Rooms', 'room_name', null, filters); // No suggestions needed for rooms
}

// ----------------------------------------------------------------Submit record start--------------------------------------------------
// SubmitLeads

/**
 * Handles the form submission for booking a room.
 * Disables the submit button during submission to prevent multiple submissions.
 */
submitBtn.addEventListener("click", async (event) => {

    event.preventDefault();

    // Disable the submit button immediately
    submitBtn.disabled = true;

    //---------------utility Function ----------------------
    /**
     * Returns the current date in 'yyyy-mm-dd' format if money is collected, otherwise returns null.
     * @param {string} moneyCollectedValue - The value from the dropdown indicating whether money was collected.
     * @returns {string|null} - The current date in 'yyyy-mm-dd' format or null if money wasn't collected.
     */
    function getCurrentDate(moneyCollectedValue) {
        if (moneyCollectedValue === "No") {
            return null;
        }
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
        return `${year}-${month}-${day}`;
    }
    //---------------utility Function ----------------------

    // Collect all necessary form data into an object
    const moneyCollectedValue = document.getElementById('money_collected_dropdown').value;
    const cardStatusValue = document.getElementById('card_status_dropdown').value;
    const currentDate = getCurrentDate(moneyCollectedValue);

    // Collect form values
    const formData = {
        customer: document.getElementById('company').value,
        client_name: document.getElementById('externalclientname').value,
        phone_number: document.getElementById("externalclientnumber").value,
        lead_id: lead_id, // Global variable
        email: email, // Global variable
        location: document.getElementById('location').value,
        room_type: document.getElementById('room_type').value,
        room: document.getElementById('room').value,
        booking_date: document.getElementById('booking_date').value,
        money_collected: moneyCollectedValue,
        money_collected_date: currentDate,
        card_status: cardStatusValue,
        price: total_price.innerHTML, // Global variable
        booking_time: getSelectedSlots(),  // Fetch the selected time slots
        total_hours: getSelectedSlots().length / 2 // Each slot is half an hour
    };

    // Validate the form data to ensure all required fields are filled
    const validationError = validateForm(formData);
    if (validationError) {
        alert(validationError);
        submitBtn.disabled = false;  // Re-enable button on failure
        return;
    }

    // Add the rate to form data (roomPrice is defined globally)
    formData.rate = roomPrice;

    try {
        // Attempt to create a new booking
        createNewBooking(formData);
    } catch (error) {
        alert('Error creating booking:', error);
        console.error('Error creating booking:', error);
    } finally {
        // Ensure the button is re-enabled regardless of success or failure
        submitBtn.disabled = false;
    }
});

/**
 * Validates the form data to ensure all required fields are filled.
 * @param {object} data - The form data to validate.
 * @returns {string|null} - Returns an error message if validation fails, otherwise null.
 */
function validateForm(data) {
    if (!data.customer) return "Please enter customer name.";
    if (!data.lead_id) return "Please select lead id.";
    if (!data.email) return "Please enter email.";
    if (!data.location) return "Please select location.";
    if (!data.room_type) return "Please select room type.";
    if (!data.room) return "Please select room.";
    if (!data.booking_date) return "Please select booking date.";
    if (data.booking_time.length === 0) return "Please select slots.";
    return null;  // No validation errors
}

// Function to get selected time slots
function getSelectedSlots() {
    const selectedSlots = document.querySelectorAll('.time-slot.selected');
    return Array.from(selectedSlots).map(slot => slot.textContent);
}

/**
 * Creates a new room booking record in the database.
 * @param {object} formData - The form data to be used for creating the booking.
 */
function createNewBooking(formData) {
    if (formData.booking_time.length === 0) {
        alert("Please select at least one time slot!");
        return;
    }

    // Create the booking in the database using a frappe API call
    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: {
                doctype: "Room Booking slot",
                customer_type: "External Client",
                customer_name: formData.customer,
                client_name:formData.client_name,
                phone_number: formData.phone_number,
                lead_id: formData.lead_id,
                status: 'Approved',
                customer_email: formData.email,
                location: formData.location,
                rate: formData.rate,
                price: formData.price,
                room_type: formData.room_type,
                room: formData.location + ' - ' + formData.room,
                booking_date: formData.booking_date,
                booking_time: JSON.stringify(formData.booking_time),
                money_collected: formData.money_collected,
                money_collected_date: formData.money_collected_date,
                card_status: formData.card_status,
                total_hours: formData.total_hours,
                block_temp: 0 //'block_temp' is a necessary field for the database
            }
        },
        callback: function (response) {
            if (response && response.message) {
                alert("Booking created successfully!");
                setTimeout(() => {
                    submitBtn.disabled = false;
                    location.reload(); // Reload the page after a delay
                }, 1000);
            } else {
                alert("Error creating booking!");
            }
        },
        error: function (err) {
            console.error("Error creating booking:", err);
            alert("Error creating booking!");
        }
    });
}

// ----------------------------------------------------------------Submit record end--------------------------------------------------

// ----------------------------------------------------------------Loader start--------------------------------------------------
/**
 * Displays the loader on the page.
 */
function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

/**
 * Hides the loader on the page.
 */
function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}
// ----------------------------------------------------------------Loader end--------------------------------------------------
