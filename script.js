// Declare global variable for lead_id
let lead_id = null;
let total_booking_price = 0;
let roomPrice = 0;

const submitButton = document.getElementById('submitButton');
const clearButton = document.getElementById('clearButton');

function isValidMobileNumber(mobileNo) {
    // Check if mobile number is exactly 10 digits
    return /^\d{10}$/.test(mobileNo);
}

// Function to check for leads based on mobile number and email
async function checkLeads() {
    const mobileNo = document.getElementById("externalclientnumber").value.trim();
    const email = document.getElementById("externalclientemail").value.trim();

    if (!isValidMobileNumber(mobileNo)) {
        alert("Mobile number must be exactly 10 digits long.");
        return;
    }

    if (!email) {
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

    if (!isValidMobileNumber(mobileNo)) {
        alert("Mobile number must be exactly 10 digits long.");
        return;
    }

    if (!email || !name || !companyName) {
        alert("Mobile number and email and name and company name are required to create a lead.");
        return;
    }

    showLoader();
    try {
        const response = await frappe.call({
            method: "novelite.api.bookings_api.external_client_booking.create_new_lead",
            args: { "mobile_no": mobileNo, "email": email, "name": name, "comapny_name": companyName },
        });

        const result = response.message;
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

// Modified fetchFormData to handle different scenarios
function fetchFormData(doctype, field, filters = []) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters,
        },
        callback: function (response) {
            if (doctype === 'Property Location') {
                const selectElement = document.getElementById('location');
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
                    roomSelectElement.disabled = true;
                } else {
                    roomSelectElement.disabled = false;
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

// New function to fetch room types dynamically
function fetchRoomTypes(location) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: 'Rooms',
            fields: ['room_type'],
            filters: [['location', '=', location]],
            group_by: 'room_type'
        },
        callback: function (response) {
            const roomTypeSelect = document.getElementById('room_type');
            roomTypeSelect.innerHTML = ''; // Clear existing options

            if (response.message && response.message.length > 0) {
                // Populate room types that have rooms in the selected location
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.room_type;
                    option.textContent = item.room_type;
                    roomTypeSelect.appendChild(option);
                });

                // Trigger room type change to fetch initial rooms
                if (roomTypeSelect.options.length > 0) {
                    roomTypeSelect.selectedIndex = 0;
                    roomTypeSelect.dispatchEvent(new Event('change'));
                }
            } else {
                // No room types available for this location
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No Room Types Available';
                roomTypeSelect.appendChild(option);

                // Clear rooms and reset price
                const roomSelect = document.getElementById('room');
                roomSelect.innerHTML = '<option value="">No Rooms Available</option>';
                document.getElementById('price_per_hour').innerHTML = '0';
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

// Event listeners for dynamic filtering
document.addEventListener('DOMContentLoaded', () => {
    fetchFormData('Property Location', 'name');
});

document.getElementById('location').addEventListener('change', function () {
    const selectedLocation = this.value;
    
    // Fetch room types specific to this location
    fetchRoomTypes(selectedLocation);
});

document.getElementById('room_type').addEventListener('change', function () {
    const selectedLocation = document.getElementById('location').value;
    const selectedRoomType = this.value;
    
    // Fetch rooms for the selected location and room type
    fetchRooms(selectedLocation, selectedRoomType);
    fetchPrice(selectedLocation, selectedRoomType);
});

function fetchRooms(location, roomType) {
    const filters = [
        ['location', '=', location],
        ['room_type', '=', roomType]
    ];
    
    fetchFormData('Rooms', 'name', filters);
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
                    ['room', '=', room],
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

    // Modified logic to round to the nearest 30-minute interval
    let start = (new Date(date).toDateString() === currentDate.toDateString()) ?
        new Date(currentTime) : startOfDay;

    // Round down to the nearest 30-minute interval
    const minutes = start.getMinutes();
    start.setMinutes(minutes >= 30 ? 30 : 0);

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
    client_name: "",
    phone_number: "",
    customer_email: "",
    customer_name: "",
    lead_id: "",
    location: "",
    room_type: "",
    room: "",
    booking_date: "",
    money_collected: "",
    money_collected_date: "",
    card_status: "",
    price: "",
    booking_time: [],
    total_hours: 0
}

submitButton.addEventListener("click", function (event) {
    // event.preventDefault();

    submitButton.disabled = true;

    external_client_booking_data.client_name = document.getElementById("externalclientname").value.trim();
    external_client_booking_data.phone_number = document.getElementById("externalclientnumber").value.trim();
    external_client_booking_data.customer_email = document.getElementById("externalclientemail").value.trim();
    external_client_booking_data.customer_name = document.getElementById("company").value.trim();
    external_client_booking_data.lead_id = document.getElementById("lead_id").value;
    external_client_booking_data.location = document.getElementById("location").value;
    external_client_booking_data.room_type = document.getElementById("room_type").value;
    external_client_booking_data.room = document.getElementById("room").value;
    external_client_booking_data.booking_date = document.getElementById("booking_date").value;
    external_client_booking_data.money_collected = document.getElementById("money_collected_dropdown").value;
    external_client_booking_data.card_status = document.getElementById("card_status_dropdown").value;
    external_client_booking_data.price = document.getElementById("total_amount").innerHTML.trim();
    external_client_booking_data.booking_time = getSelectedSlots();
    external_client_booking_data.total_hours = getSelectedSlots().length / 2;

   if (external_client_booking_data.money_collected === "Yes") {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        external_client_booking_data.money_collected_date = formattedDate;
    }
     
    // Validating the form
    const missingFields = [];
    if (!external_client_booking_data.client_name) missingFields.push("Name");
    if (!external_client_booking_data.phone_number) missingFields.push("Phone Number");
    if (!external_client_booking_data.customer_email) missingFields.push("Email");
    if (!external_client_booking_data.customer_name) missingFields.push("Company");
    if (!external_client_booking_data.lead_id) missingFields.push("Lead ID");
    if (!external_client_booking_data.location) missingFields.push("Location");
    if (!external_client_booking_data.room_type) missingFields.push("Room Type");
    if (!external_client_booking_data.room) missingFields.push("Room");
    if (!external_client_booking_data.booking_date) missingFields.push("Booking Date");
    if (!external_client_booking_data.money_collected) missingFields.push("Money Collected");
    if (!external_client_booking_data.card_status) missingFields.push("Card Status");
    if (!external_client_booking_data.price) missingFields.push("Total Amount");
    if (external_client_booking_data.booking_time.length === 0) missingFields.push("Booked Slots");

    // Show alert if fields are missing
    if (missingFields.length > 0) {
        alert(`Please fill in the following fields correctly:\n- ${missingFields.join("\n- ")}`);
        return;
    } else {

        let bookingData = {
            doctype: "Room Booking slot",
            customer_type: "External Client",
            client_name: external_client_booking_data.client_name,
            phone_number: external_client_booking_data.phone_number,
            customer_email: external_client_booking_data.customer_email,
            customer_name: external_client_booking_data.customer_name,
            lead_id: external_client_booking_data.lead_id,
            location: external_client_booking_data.location,
            room_type: external_client_booking_data.room_type,
            room: external_client_booking_data.room,
            booking_date: external_client_booking_data.booking_date,
            money_collected: external_client_booking_data.money_collected,
            money_collected_date: external_client_booking_data.money_collected_date,
            card_status: external_client_booking_data.card_status,
            price: external_client_booking_data.price,
            total_hours: external_client_booking_data.total_hours,
            block_temp: 0,
            booking_time: JSON.stringify(external_client_booking_data.booking_time)
        }

        
        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: bookingData
            },
            callback: function (response) {
                if (response && response.message) {
                    alert("Booking created successfully!");
                    setTimeout(() => {
                        submitButton.disabled = false;
                        // location.reload();  // Reload the page after a delay
                    }, 2000);
                } else {
                    alert("Error creating booking!");
                    submitButton.disabled = false;
                }
            },
            error: function (err) {
                console.error("Error creating booking:", err);
                alert("Error creating booking!");
                submitButton.disabled = false;
            }
        });
    }
})

function showLoader() {
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}