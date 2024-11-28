// Declare global variable for lead_id
let lead_id = null;
let total_booking_price = 0;
let roomPrice = 0;

const submitButton = document.getElementById('submitButton');
const clearButton = document.getElementById('clearButton');

// Function to check for leads based on mobile number and email
async function checkLeads() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    const email = document.getElementById("externalclientemail").value.trim();

    if (!mobileNo || !email) {
        alert("Please fill in both Mobile Number and Email.");
        return;
    }

    showLoader();

    try {
        const response = await frappe.call({
            method: "novelite.api.bookings_api.external_client_booking.check_in_leads",
            args: { mobile_no: mobileNo, email: email },
        });

        const result = response.message;
        console.log("result:", result);

        hideLoader();

        if (result.includes("No leads found")) {
            showModal("No Lead Found", `<button class="btn btn-active w-32" onclick="createLead()">Create Lead</button>`);
        } else {
            lead_id = result[0].name;
            showModal("Lead Found", `<p class="text-lg font-semibold">Lead ID: ${lead_id}</p>`);
            updateLeadIdDropdown(lead_id);
        }

    } catch (error) {
        console.error("API Error:", error);
        alert("An error occurred while checking leads.");
        hideLoader();
    }
}

// Function to update total amount display
function updateTotalAmount(selectedSlots) {
    const totalAmount = (roomPrice / 2) * selectedSlots.length; // Each slot is 30 mins
    total_booking_price = totalAmount; // Update global variable

    const totalAmountElement = document.getElementById('total_amount');
    if (totalAmountElement) {
        totalAmountElement.textContent = totalAmount.toFixed(2);
    }
}

// Function to show the modal with dynamic content
function showModal(title, content) {
    const modal = document.getElementById("my_modal_checkLeads");
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogContent").innerHTML = content;
    if (modal) modal.showModal();
}

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

async function createLead() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    const email = document.getElementById("externalclientemail").value.trim();
    const name = document.getElementById("externalclientname").value.trim();
    const companyName = document.getElementById("company").value.trim();

    if (!mobileNo || !email || !name || !companyName) {
        alert("Mobile number and email and name and companyName are required to create a lead.");
        return;
    }

    showLoader();
    console.log(name, companyName)
    try {
        const response = await frappe.call({
            method: "novelite.api.bookings_api.external_client_booking.create_new_lead",
            args: { "mobile_no": mobileNo, "email": email, "name": name, "comapny_name": companyName },
        });

        const result = response.message;
        console.log("Created lead:", result);

        if (result) {
            lead_id = result.name;
            updateLeadIdDropdown(lead_id);
            showModal("Lead Created", `<p class="text-lg font-semibold">New Lead ID: ${lead_id}</p>`);
        }

    } catch (error) {
        console.error("API Error:", error);
        alert("An error occurred while creating a new lead.");
    } finally {
        hideLoader();
    }
}

function updateLeadIdDropdown(newLeadId) {
    const leadIdSelect = document.getElementById("lead_id");
    if (leadIdSelect) {
        leadIdSelect.innerHTML = "";
        const newOption = document.createElement("option");
        newOption.value = newLeadId;
        newOption.text = newLeadId;
        newOption.selected = true;
        leadIdSelect.appendChild(newOption);
    }
}

function fetchFormData(doctype, field, filters = []) {
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
                selectElement.innerHTML = '';
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    selectElement.appendChild(option);
                });
            } else if (doctype === 'Rooms') {
                const roomSelectElement = document.getElementById('room');
                roomSelectElement.innerHTML = '';

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

            // Reset total amount when price changes
            updateTotalAmount([]);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchFormData('Property Location', 'name');
    fetchFormData('Room Type', 'name');
});

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

function fetchRooms(location, roomType) {
    const filters = [['location', '=', location]];
    if (roomType) {
        filters.push(['room_type', '=', roomType]);
    }
    fetchFormData('Rooms', 'room_name', filters);
}

clearButton.style.visibility = 'hidden';

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
                    const bookedSlots = response.message
                        .map(slot => JSON.parse(slot.booking_time))
                        .flat();
                    const uniqueBookedSlots = [...new Set(bookedSlots)];
                    resolve(uniqueBookedSlots);
                } else {
                    resolve([]);
                }
            },
            error: function (err) {
                console.error("Error fetching booked slots:", err);
                reject(err);
            }
        });
    });
}

function getSelectedSlots() {
    return Array.from(newSlotsContainer.getElementsByClassName('selected'));
}

async function generateNewTimeSlots(date) {
    const location = document.getElementById('location').value;
    const roomType = document.getElementById('room_type').value;
    const room = document.getElementById('room').value;
    const selectedDate = document.getElementById('booking_date').value;

    newSlotsContainer.innerHTML = '';

    const bookedSlots = await fetchBookedSlots(location, roomType, room, selectedDate);

    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:30:00`);

    let start = (new Date(date).toDateString() === currentDate.toDateString()) ?
        new Date(currentTime) : startOfDay;

    if (start.getMinutes() >= 30) {
        start.setMinutes(0);
        start.setHours(start.getHours() + 1);
    } else if (start.getMinutes() > 0) {
        start.setMinutes(30);
    } else {
        start.setMinutes(0);
    }

    if (start > endOfDay) return;

    let firstSelectedSlot = null;

    while (start <= endOfDay) {
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        const timeSlot = `${hours}:${minutes}`;

        let slotElement = document.createElement('div');
        slotElement.classList.add('time-slot');
        slotElement.textContent = timeSlot;

        if (bookedSlots.includes(timeSlot)) {
            slotElement.classList.add('disabled');
            slotElement.style.backgroundColor = '#999999b8';
            slotElement.style.color = 'white';
            slotElement.style.cursor = 'not-allowed';
        } else {
            slotElement.addEventListener('click', () => {
                if (!firstSelectedSlot) {
                    firstSelectedSlot = slotElement;
                    slotElement.classList.add('selected');
                    slotElement.style.backgroundColor = '#4caf50';
                } else {
                    let startTime = new Date(`1970-01-01T${firstSelectedSlot.textContent}:00`);
                    let endTime = new Date(`1970-01-01T${timeSlot}:00`);

                    if (endTime < startTime) {
                        [firstSelectedSlot, slotElement] = [slotElement, firstSelectedSlot];
                        [startTime, endTime] = [endTime, startTime];
                    }

                    let currentSlot = firstSelectedSlot;
                    let bookedInBetween = false;
                    while (currentSlot !== slotElement) {
                        if (bookedSlots.includes(currentSlot.textContent)) {
                            bookedInBetween = true;
                            break;
                        }
                        currentSlot = currentSlot.nextElementSibling;
                    }

                    if (bookedInBetween) {
                        alert('Some slots are already booked in between. Please select a different range.');
                        return;
                    }

                    currentSlot = firstSelectedSlot;
                    while (currentSlot !== slotElement) {
                        currentSlot.classList.add('selected');
                        currentSlot.style.backgroundColor = '#4caf50';
                        currentSlot = currentSlot.nextElementSibling;
                    }
                    slotElement.classList.add('selected');
                    slotElement.style.backgroundColor = '#4caf50';
                }

                // Update total amount after slot selection
                const selectedSlots = getSelectedSlots();
                updateTotalAmount(selectedSlots);

                clearButton.style.visibility = selectedSlots.length > 0 ? 'visible' : 'hidden';
            });
        }

        newSlotsContainer.appendChild(slotElement);
        start.setMinutes(start.getMinutes() + 30);
    }

    // Clear button functionality
    clearButton.addEventListener('click', () => {
        const selectedSlots = getSelectedSlots();
        selectedSlots.forEach(slot => {
            slot.classList.remove('selected');
            slot.style.backgroundColor = '';
        });

        firstSelectedSlot = null;
        clearButton.style.visibility = 'hidden';

        // Reset total amount when clearing selection
        updateTotalAmount([]);
    });
}

const bookingDateInput = document.getElementById('booking_date');
const newSlotsContainer = document.getElementById('newSlotsContainer');

bookingDateInput.addEventListener('change', function () {
    const selectedDate = new Date(this.value);
    const currentDate = new Date();

    selectedDate.setHours(currentDate.getHours());
    selectedDate.setMinutes(currentDate.getMinutes());
    selectedDate.setSeconds(currentDate.getSeconds());
    selectedDate.setMilliseconds(currentDate.getMilliseconds());

    if (selectedDate < currentDate) {
        const currentDateString = currentDate.toISOString().split('T')[0];
        bookingDateInput.value = currentDateString;
        generateNewTimeSlots(currentDateString);
        alert("Can't select previous date");
    } else {
        generateNewTimeSlots(this.value);
    }
});


const external_client_booking_data = {
    name: "",
    number: "",
    email: "",
    company: "",
    leadid: "",
    location: "",
    roomtype: "",
    room: "",
    bookingdate: "",
    moneycollected: "",
    cardstatus: "",
    totalamount: "",
    bookedslots: []
}

submitButton.addEventListener("click", function (event) {
    event.preventDefault();
    external_client_booking_data.name = document.getElementById("externalclientname").value.trim();
    external_client_booking_data.number = document.getElementById("externalclientnumber").value.trim();
    external_client_booking_data.email = document.getElementById("externalclientemail").value.trim();
    external_client_booking_data.company = document.getElementById("company").value.trim();
    external_client_booking_data.leadid = document.getElementById("lead_id").value;
    external_client_booking_data.location = document.getElementById("location").value; 
    
    external_client_booking_data.roomtype = document.getElementById("room_type").value;
    external_client_booking_data.room = document.getElementById("room").value;
    external_client_booking_data.bookingdate = document.getElementById("booking_date").value;
    external_client_booking_data.moneycollected = document.getElementById("money_collected_dropdown").value;
    external_client_booking_data.cardstatus = document.getElementById("card_status_dropdown").value;
    external_client_booking_data.totalamount = document.getElementById("total_amount").innerHTML.trim();
    external_client_booking_data.bookedslots = getSelectedSlots().map(slot => slot.textContent);


    // Validating the form
    const missingFields = [];
    if (!external_client_booking_data.name) missingFields.push("Name");
    if (!external_client_booking_data.number) missingFields.push("Phone Number");
    if (!external_client_booking_data.email) missingFields.push("Email");
    if (!external_client_booking_data.company) missingFields.push("Company");
    if (!external_client_booking_data.leadid) missingFields.push("Lead ID");
    if (!external_client_booking_data.location) missingFields.push("Location");
    if (!external_client_booking_data.roomtype) missingFields.push("Room Type");
    if (!external_client_booking_data.room) missingFields.push("Room");
    if (!external_client_booking_data.bookingdate) missingFields.push("Booking Date");
    if (!external_client_booking_data.moneycollected) missingFields.push("Money Collected");
    if (!external_client_booking_data.cardstatus) missingFields.push("Card Status");
    if (!external_client_booking_data.totalamount) missingFields.push("Total Amount");
    if (external_client_booking_data.bookedslots.length === 0) missingFields.push("Booked Slots");

    console.log("missgFields.....", missingFields)

    // Show alert if fields are missing
    if (missingFields.length > 0) {
        alert(`Please fill in the following fields correctly:\n- ${missingFields.join("\n- ")}`);
        return;
    }

    // If validation passes
    alert("Form submitted successfully!");
    console.log(external_client_booking_data);

})

function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}