// Global Variables
let allBookings = []; // Store all bookings globally
let currentRecord = null; // Store the current record globally
let PassId = ""; // Store the ID of the current booking
let selectedTimes = []; // Store selected times
let startTimeToShow = "";
let endTimeToShow = "";
let roomPrice = 0;
let pricePerHour = 0;
let total_booking_price = 0;
let bookingData = {};
let confirmed_locations = [];
let Billing_location_of_client = "";
let customer_name = "";

let previousValueOfwaveOffAmount = "";
let previousValueOfwaveOffComplimentary = "";
let previousValueOfaccountVerification = "";

let currentValueOfwaveOffAmount = "";
let currentValueOfwaveOffComplimentary = "";
let currentValueOfaccountVerification = "";

// Pagination Variables
let currentPagePending = 1; // Current page number for pending bookings
let totalPagesPending = 1; // Total pages for pending bookings
const itemsPerPage = 10; // Number of items per page for pending bookings

//Submit buttons
const submitBtn = document.querySelector(".submitBtn");
const submitRecordBtn = document.querySelector(".submitRecordBtn");
const confirmBookingbtn = document.querySelector(".confirmBookingbtn");

// DOM Elements
const slotsContainer = document.getElementById('slotsContainer');
const myDateInput = document.getElementById('myDate');
// DOM Elements
// const dashboardBtn = document.getElementById("dashboard-btn");
const newBookingBtn = document.getElementById("newbooking-btn");
const externalNewbookingBtn = document.getElementById("external_newbooking_btn");
const firstSection = document.getElementById('first-section');
const secondSection = document.getElementById('second-section');
const toast = document.querySelector(".toast");
const closeModalBtn = document.querySelector('.closeBtn');
const closeBtnInvoice = document.querySelector('.closeBtn_invoice');
const closeBtn_external_client_booking = document.querySelector('.closeBtn_external_client_booking');
const clearButton = document.getElementById('clearButton');
const money_collected_div = document.getElementById('money_collected_div');

//All Modals
const modal = document.getElementById('my_modal_3');
const modal_invoice = document.getElementById('my_modal_3_invoice');
// const external_client_booking_modal = document.getElementById('my_modal_3_external_client_booking');

//This is to get the values of dropdowns
const money_collected = document.getElementById('money_collected');
// const card_status = document.getElementById('card_status');

//Invoice Modal
const customer_invoice = document.getElementById("customer_invoice");
const email_invoice = document.getElementById("email-field_invoice");
const company_invoice = document.getElementById("company-field_invoice");
const lead_invoice = document.getElementById("leadId_invoice");
const roomType_invoice = document.getElementById("roomType_invoice");
const date_invoice = document.getElementById("myDate_invoice");
const location_invoice = document.getElementById("location_invoice");
const roomname_invoice = document.getElementById("room_name_invoice");
const startTime_invoice = document.getElementById("startTime_invoice");
const endTime_invoice = document.getElementById("endTime_invoice");
const billing_location_invoice = document.getElementById("billing_location_invoice");
const client_type_invoice = document.getElementById("clientType_invoice");

//Billing Details
const complimentary_available = document.getElementById("complimentary_available");
const booked_hours = document.getElementById("booked_hours");
const billable_hours = document.getElementById("billable_hours");
const total_price = document.getElementById('total_price');

let money_collected_value = "No";
// let card_status_value = "Not issued";

// Money collected change event listener
money_collected.addEventListener('change', (e) => {
    money_collected_value = e.target.value;
    submitRecordBtn.disabled = false;
});

// Card status change event listener
// card_status.addEventListener('change', (e) => {
//     card_status_value = e.target.value;
//     submitRecordBtn.disabled = false;
// });

toast.style.display = 'none';
clearButton.style.visibility = 'hidden'

//toggle for nav bar
// Event Listeners for Navigation Buttons
// dashboardBtn.addEventListener("click", function () {
//     firstSection.style.display = 'block';
//     secondSection.style.display = 'none';
// });

// newBookingBtn.addEventListener("click", function () {
//     firstSection.style.display = 'none';
//     secondSection.style.display = 'block';
// });




// Add event listener to close the modal
closeModalBtn.addEventListener('click', function () {
    modal.close(); // Close the modal (if you're using a dialog element)
    resetModalContent(); // Reset the modal content if necessary
});
// Add event listener to close the modal of invoice
closeBtnInvoice.addEventListener('click', function () {
    modal_invoice.close(); // Close the modal (if you're using a dialog element)
    resetInvoiceModal(); // Reset the modal content if necessary
});

// Add event listener to close the modal of external client booking
closeBtn_external_client_booking.addEventListener('click', function () {
    my_modal_3_external_client_booking.close(); // Close the modal (if you're using a dialog element)
});

// Reset the modal content, if needed
function resetModalContent() {
    //For details fields
    document.querySelector(".pass-id").innerHTML = '';
    document.querySelector(".status").innerHTML = '';
    document.querySelector(".card").innerHTML = '';
    document.getElementById("room_type_show").innerHTML = '';
    document.getElementById("email-field").innerHTML = '';
    document.getElementById("fullname-field").innerHTML = '';
    document.getElementById("clientType").innerHTML = '';
    document.getElementById("price").innerHTML = '';
    document.getElementById("location-field").innerHTML = '';
    document.getElementById("date-field").innerHTML = '';
    document.getElementById("myDate").innerHTML = '';
}

function resetInvoiceModal() {
    //For invoice fields
    customer_invoice.innerHTML = "";
    email_invoice.innerHTML = "";
    location_invoice.innerHTML = "";
    lead_invoice.innerHTML = "";
    date_invoice.innerHTML = "";
    roomType_invoice.innerHTML = "";
    roomname_invoice.innerHTML = "";
    startTime_invoice.innerHTML = "";
    endTime_invoice.innerHTML = "";
}

// Event Listener for Date Change
myDateInput.addEventListener('change', function () {
    const selectedDate = this.value;
    let bookingTimesForCurrentRecord = [];

    // If the selected date is the same as the current record's date, use its booking times
    if (currentRecord && selectedDate === currentRecord.booking_date) {
        if (currentRecord.booking_time === "Full Day") {
            fetc
            bookingTimesForCurrentRecord = generateFullDayTimeSlots();
        } else {
            try {
                bookingTimesForCurrentRecord = JSON.parse(currentRecord.booking_time);
            } catch (error) {
                console.error("Error parsing booking_time for current record:", error);
            }
        }
    }

    // Regenerate time slots based on the newly selected date
    generateTimeSlots(selectedDate, bookingTimesForCurrentRecord, currentRecord ? currentRecord.booking_date : null);

});

// Function to fetch all bookings for a specific location, room type, and room based on the current record
async function fetchAllBookingsForRecord(record) {
    const filters = [
        ['location', '=', record.location],
        ['room_type', '=', record.room_type],
        ['room', '=', record.room],
        ['status', '=', 'Cancelled'],

    ];

    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Room Booking slot",
                fields: ['name', 'booking_date', 'booking_time'], // Include 'name' field
                filters: filters,// Fetch bookings based on location, room type, and room
            },
            callback: function (response) {
                if (response && response.message) {
                    allBookings = response.message; // Store all relevant bookings globally
                    resolve();
                } else {
                    reject("Failed to fetch filtered bookings.");
                }
            }
        });
    });
}

// Function to generate full day time slots
function generateFullDayTimeSlots() {
    const fullDaySlots = [];
    const start = new Date("1970-01-01T00:00:00");
    const end = new Date("1970-01-01T23:30:00");

    while (start <= end) {
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        const timeSlot = `${hours}:${minutes}`;
        fullDaySlots.push(timeSlot);

        // Increment the time by 30 minutes
        start.setMinutes(start.getMinutes() + 30);
    }
    return fullDaySlots;
}

// Function to generate time slots for a selected date
function generateTimeSlots(date, bookingTimesForCurrentRecord, currentRecordDate) {
    slotsContainer.innerHTML = ''; // Clear existing slots

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:30:00`); // Adjusted to include the last slot at 23:30

    // Exclude the current record from globally booked times
    const globallyBookedTimes = allBookings
        .filter(booking => booking.booking_date === date && booking.name !== (currentRecord ? currentRecord.name : ''))
        .flatMap(booking => {
            try {
                if (booking.booking_time === "Full Day") {
                    return generateFullDayTimeSlots();
                }
                return JSON.parse(booking.booking_time);
            } catch (error) {
                console.error("Error parsing booking_time:", error);
                return [];
            }
        });

    while (start <= end) {
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        const timeSlot = `${hours}:${minutes}`;

        // Create slot element
        const slotElement = document.createElement('div');
        slotElement.classList.add('time-slot');
        slotElement.textContent = timeSlot;

        // Check if the slot is globally booked
        const isGloballyBooked = globallyBookedTimes.includes(timeSlot);
        // Check if the slot is part of the current record's booking time
        const isCurrentRecordSlot = bookingTimesForCurrentRecord.includes(timeSlot);
        // Check if the slot is in both globally booked times and the current record
        const isCommonSlot = isGloballyBooked && isCurrentRecordSlot;

        if (date === currentRecordDate) {
            if (isCommonSlot) {
                // Red slots for common slots (globally booked + current record)
                slotElement.classList.add('selected');
                slotElement.style.backgroundColor = 'red';
                slotElement.style.color = 'white';

                // Allow deselection for common slots, and mark as globally booked (disabled) when deselected
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');

                    if (!slotElement.classList.contains('selected')) {
                        // When deselected, mark as globally booked (disabled)
                        slotElement.classList.add('disabled');
                        slotElement.style.backgroundColor = '#999999b8'; // Grey color
                        slotElement.style.color = 'white';
                        slotElement.style.cursor = 'not-allowed';
                    } else {
                        // Re-select (if needed)
                        slotElement.style.backgroundColor = 'red';
                    }
                });
            } else if (isCurrentRecordSlot) {
                // Blue slots for current record's booking times
                slotElement.classList.add('selected');
                slotElement.style.backgroundColor = '#2f41ec';

                // Allow toggling (modification) for current record's slots
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#2f41ec' : '';
                });
            } else if (isGloballyBooked) {
                // Grey slots for globally booked times not part of the current record
                slotElement.classList.add('disabled');
                slotElement.style.backgroundColor = '#999999b8';
                slotElement.style.color = 'white';
                slotElement.style.cursor = 'not-allowed';
            } else {
                // Available slots on the current record's date
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#4caf50' : '';
                });
            }
        } else {
            // For other dates
            if (isGloballyBooked) {
                // Grey slots for globally booked times
                slotElement.classList.add('disabled');
                slotElement.style.backgroundColor = '#999999b8';
                slotElement.style.color = 'white';
                slotElement.style.cursor = 'not-allowed';
            } else {
                // Available slots on other dates
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#4caf50' : '';
                });
            }
        }

        // Append the slot element to the container
        slotsContainer.appendChild(slotElement);

        // Increment the time by 30 minutes
        start.setMinutes(start.getMinutes() + 30);
    }
}



// Function to handle a record being opened
function handleRecordOpen(record) {
    currentRecord = record; // Store the current record globally

    const recordBookingDate = record.booking_date;
    let bookingTimesForCurrentRecord = [];

    if (record.booking_time === "Full Day") {
        // Generate all time slots for the full day
        bookingTimesForCurrentRecord = generateFullDayTimeSlots();
    } else {
        try {
            bookingTimesForCurrentRecord = JSON.parse(record.booking_time);
        } catch (error) {
            console.error("Error parsing booking_time for current record:", error);
        }
    }

    // Generate time slots for the record's booking date with the record's booking times
    generateTimeSlots(recordBookingDate, bookingTimesForCurrentRecord, recordBookingDate);
}

// Fetch single room booking record data for display
function fetchSingleData(id) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Room Booking slot",
            name: id,
        },
        callback: async function (response) {
            const record = response.message;

            // Store the current record's ID
            PassId = id;

            // Fetch all bookings based on location, room type, and room of the current record
            await fetchAllBookingsForRecord(record);

            // Call handleRecordOpen() to process the booking times and slots
            handleRecordOpen(record);

            // Also, display the record's details (populate modal, etc.)
            appendDetails(record);
        }
    });
}

// Inserting booking data into modal
function appendDetails(data) {
    document.querySelector(".card").innerHTML = data.status;
    document.querySelector(".pass-id").innerHTML = data.name;
    document.getElementById("price").innerHTML = data.price;
    document.getElementById("date-field").innerHTML = data.room;
    document.getElementById("room_type_show").innerHTML = data.room_type;
    document.getElementById("email-field").innerHTML = data.email ? data.email : data.customer_email;
    document.getElementById("fullname-field").innerHTML = data.customer ? data.customer : data.customer_name;
    document.getElementById("location-field").innerHTML = data.location;
    document.getElementById("myDate").innerHTML = data.booking_date;
    document.getElementById("startTime").innerHTML = startTimeToShow;
    document.getElementById("endTime").innerHTML = endTimeToShow;
    document.getElementById("clientType").innerHTML = data.client_type ? data.client_type : "---------";
    money_collected.value = data.money_collected;
    // card_status.value = data.card_status;
    money_collected_value = data.money_collected;
    // card_status_value = data.card_status;

    // These are just to show, not to edit
    document.getElementById("money_collected_show").innerHTML = data.money_collected;
    document.getElementById("card_status_show").innerHTML = data.card_status;

    // Hide money collection dropdown for "Deposit" client
    money_collected_div.style.display = data.client_type === 'Deposit' ? 'none' : 'block';

    // Get the current date and subtract 3 days to get the comparison date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 3); // Subtract 3 days
    const currentDateMinus3Days = new Date(currentDate.toISOString().split('T')[0]); // Set time to 00:00:00

    // Parse the booking time from the data object (ensure it's a valid date)
    const bookingDate = new Date(data.booking_date);

    const readOnlyDivs = document.querySelectorAll(".readOnlyDiv");
    const moneyCollectedReadOnly = document.querySelector(".readOnlyDiv1");
    const cardStatusReadOnly = document.querySelector(".readOnlyDiv2");
    const editDiv = document.getElementById('editDiv');

    // Compare the dates (if bookingDate is less than current date minus 3 days)
    if (bookingDate < currentDateMinus3Days) {
        editDiv.style.display = 'none';
        readOnlyDivs.forEach((div) => {
            div.style.display = 'block';
        });
        submitRecordBtn.style.display = 'none';
    } else {
        editDiv.style.display = 'block';
        readOnlyDivs.forEach((div) => {
            div.style.display = 'none';
        });
        submitRecordBtn.style.display = 'block';
    }

    if (data.client_type !== 'Deposit') {
        // Handle the money collected condition
        if (data.money_collected === "Yes") {
            moneyCollectedReadOnly.style.display = 'block'; // Show money collected read-only div
            document.getElementById('money_collected_div').style.display = 'none'; // Hide dropdown
        } else {
            moneyCollectedReadOnly.style.display = 'none'; // Hide money collected read-only div
            document.getElementById('money_collected_div').style.display = 'block'; // Show dropdown
        }
    }

    // Handle the card status condition
    // if (data.card_status === "Returned") {
    //     cardStatusReadOnly.style.display = 'block'; // Show card status read-only div
    //     document.getElementById('card_status_div').style.display = 'none'; // Hide dropdown
    // } else {
    //     cardStatusReadOnly.style.display = 'none'; // Hide card status read-only div
    //     document.getElementById('card_status_div').style.display = 'block'; // Show dropdown
    // }

    let statusDiv = document.querySelector(".status");
    statusDiv.innerHTML = data.status;

    // Set status color based on status
    switch (data.status) {
        case "Pending":
            statusDiv.style.backgroundColor = "#ff7300";
            break;
        case "Approved":
            statusDiv.style.backgroundColor = "green";
            break;
        default:
            statusDiv.style.backgroundColor = "red";
            break;
    }
}


// Toast Notification
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        display: none; /* Hidden by default */
        transition: opacity 0.5s;
    }
`;
document.head.appendChild(toastStyle);

function showToast(message) {
    toast.style.display = "block";
    toast.innerHTML = message;

    // Fade out after 3 seconds
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => {
            toast.style.display = "none";
            toast.style.opacity = 1; // Reset for next use
        }, 500);
    }, 3000);
}

// ----------------------------------------------------------------Filter Start-------------------------------------------------------------
// Fetch form data for customer, location, room type, etc.
function fetchFormDataHome(doctype, field, filters = []) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters,
        },
        callback: function (response) {
            if (doctype === 'Property Location' || doctype === 'Room Type') {
                const selectElement = document.getElementById(doctype === 'Property Location' ? 'location_filter' : 'room_type_filter');
                selectElement.innerHTML = '<option value="">Select</option>'; // Clear previous options
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    selectElement.appendChild(option);
                });

                // Restore location from localStorage if available
                if (doctype === 'Property Location') {
                    const storedLocation = localStorage.getItem('selectedLocation');
                    if (storedLocation) {
                        selectElement.value = storedLocation;
                    }
                }

                // Store location in localStorage
                if (doctype === 'Property Location') {
                    selectElement.addEventListener('change', () => {
                        const selectedLocation = selectElement.value;
                        localStorage.setItem('selectedLocation', selectedLocation);
                        updateDetails(selectedLocation);
                    });
                }

            } else if (doctype === 'Rooms') {
                const roomSelectElement = document.getElementById('room_filter');
                roomSelectElement.innerHTML = '<option value="">Select Room</option>';
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    roomSelectElement.appendChild(option);
                });
            }
        }
    });
}

// Set booking date to the current date
let currentDate = new Date().toJSON().slice(0, 10);
document.getElementById("booking_date_filter").value = currentDate;
document.getElementById("toDate").value = currentDate;

// Fetch rooms based on selected location and room type
function fetchRoomsHome(location, roomType) {
    const filters = [
        ['location', '=', location],
        ['room_type', '=', roomType]
        ['status', '=', 'Cancelled']
    ];
    fetchFormDataHome('Rooms', 'room_name', filters);
}

// Event listener for location, date, room type, room changes
function updateDetails() {
    const location = document.getElementById('location_filter').value || localStorage.getItem('selectedLocation');
    let bookingDate = document.getElementById('booking_date_filter').value;
    let toDate = document.getElementById('toDate').value;

    // Default to today's date if bookingDate is empty or null
    if (!bookingDate) {
        const today = new Date();
        bookingDate = today.toISOString().split('T')[0]; // Format as yyyy-mm-dd
    }

    const roomType = document.getElementById('room_type_filter').value;
    const room = document.getElementById('room_filter').value;

    fetchData(currentPagePending, false, location, roomType, room, bookingDate, toDate);
    fetchTotalPages(location, roomType, room, bookingDate, toDate);
}

// Event listener for all filters
document.getElementById('location_filter').addEventListener('change', updateDetails);
document.getElementById('booking_date_filter').addEventListener('change', updateDetails);
document.getElementById('toDate').addEventListener('change', updateDetails);
document.getElementById('room_filter').addEventListener('change', updateDetails);
document.getElementById('room_type_filter').addEventListener('change', function () {
    const selectedLocation = document.getElementById('location_filter').value;
    const selectedRoomType = this.value;
    fetchRoomsHome(selectedLocation, selectedRoomType);
    updateDetails();
});

// ----------------------------------------------------------------Filter end-------------------------------------------------------------

frappe.ready(function () {
    console.clear();
    const user = frappe.session.user;
    if (user === "Guest" || user === "guest") {
        my_modal_1.showModal();
        return;
    }
    main();
});

//Main function to start javascript execution
function main() {
    // Get the current date
    const currentDate = new Date();

    // Format it to yyyy-mm-dd
    const formattedDate = currentDate.toISOString().split('T')[0]; // ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'

    // Locally stored location
    const storedLocation = localStorage.getItem('selectedLocation');

    // Helper function to get filter values
    const getFilterValues = () => {
        return {
            room: document.getElementById('room_filter').value,
            location: document.getElementById('location_filter').value,
            roomType: document.getElementById('room_type_filter').value,
            bookingDate: document.getElementById('booking_date_filter').value,
            toDate: document.getElementById('toDate').value
        };
    };

    fetchData(currentPagePending, false, storedLocation, null, null, formattedDate, formattedDate);
    fetchTotalPages(storedLocation, null, null, formattedDate, formattedDate); // Fetch total pages first

    submitRecordBtn.addEventListener("click", updateStatus);

    document.querySelector(".prev-page-pending").addEventListener("click", () => {
        if (currentPagePending > 1) {
            currentPagePending--;
            const { location, roomType, room, bookingDate, toDate } = getFilterValues();

            fetchData(currentPagePending, false, location, roomType, room, bookingDate, toDate);
            fetchTotalPages(location, roomType, room, bookingDate, toDate); // Fetch total pages
            document.querySelector("#current-page-pending").innerHTML = currentPagePending;
        }
    });

    document.querySelector(".next-page-pending").addEventListener("click", () => {
        if (currentPagePending < totalPagesPending) {
            currentPagePending++;
            const { location, roomType, room, bookingDate, toDate } = getFilterValues();

            fetchData(currentPagePending, true, location, roomType, room, bookingDate);
            fetchTotalPages(location, roomType, room, bookingDate, toDate); // Fetch total pages
            document.querySelector("#current-page-pending").innerHTML = currentPagePending;
        }
    });
}

// Fetch total pages for pending bookings
async function fetchTotalPages(location, roomType, room, dates, toDate) {

    const filters = [
        ['booking_date', 'between', [dates, toDate]],
        ['status', '=', 'Approved'],
        ['block_temp', '=', '0'],
    ];

    if (location) {
        filters.push(['location', '=', location]);
    }

    if (roomType) {
        filters.push(['room_type', '=', roomType]);
    }

    if (room) {
        filters.push(['room', '=', location + ' - ' + room]);
    }



}

// Fetching booking data (Approved records)
async function fetchData(pagePending, checkData = false, location, roomType, room, dates, toDate) {
    // Start building the noRecordsMessage dynamically
    let noRecordsMessageParts = [`No records to show on ${dates}`];

    let currentDate = new Date(); // Get the current date

    if (dates > toDate) {
        // Set the 'toDate' field to the current date
        document.getElementById('toDate').value = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
        alert('"From Date" cannot be greater than "To Date".');
        return;
    }

    // Initialize the filters array
    const filters = [
        ['booking_date', 'between', [dates, toDate]],
        ['status', '=', 'Cancelled'],
        ['block_temp', '=', '0'],
        ['docstatus', '=', '1']

    ];

    if (location) {
        filters.push(['location', '=', location]);
        noRecordsMessageParts.push(`at ${location} location`);
    }

    // Add filters based on roomType if available
    if (roomType) {
        filters.push(['room_type', '=', roomType]);
        noRecordsMessageParts.push(`and room type ${roomType}`);
    }

    // Add filters based on room if available
    if (room) {
        filters.push(['room', '=', location + ' - ' + room]);
        noRecordsMessageParts.push(`and room name ${room}`);
    }

    // Combine the parts to form the full message
    const noRecordsMessage = noRecordsMessageParts.join(' ');

    let allFieds = [
        'name',
        'status',
        'customer',
        'location',
        'room_type',
        'booking_date',
        'booking_time',
        'block_temp',
        'room',
        'client_type',
        'price',
        'money_collected',
        // 'card_status',
        'customer_name',
        'wave_off_amount',
        'wave_off_complimentary',
        'verified_by_accounts',
        'cancel_time',
    ]

    function checkDateDifferenceAndToggleButtons(data) {
        // Parse the booking_date and cancel_time from the data object
        const bookingDate = new Date(data.booking_date);
        const cancellationDate = data.cancel_time ? new Date(data.cancel_time) : null;

        console.log("booking and cancllation date", bookingDate, cancellationDate)

        if (cancellationDate) {
            // Calculate the difference in days
            const timeDifference = Math.abs(cancellationDate - bookingDate);
            console.log("time difference", timeDifference);

            const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
            console.log("day diff", dayDifference);


            // Disable checkboxes and submit button if the difference is more than 3 days
            if (dayDifference > 3) {
                disableCheckboxesAndButton();
            }
        }
    }

    function disableCheckboxesAndButton() {
        if (moneyWaveOff) moneyWaveOff.disabled = true;
        if (complementaryWaveOff) complementaryWaveOff.disabled = true;
        if (previousValueOfaccountVerification) previousValueOfaccountVerification.disabled = true;
        if (submitRecordBtn) submitRecordBtn.disabled = true;
    }

    // Call the API to fetch the data
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Room Booking slot",
            fields: allFieds,
            limit_start: (pagePending - 1) * itemsPerPage,
            limit_page_length: itemsPerPage,
            filters: filters
        },
        callback: function (response) {
            const paginationDiv = document.querySelector('.pagination-controls-pending');
            const noRecordsDiv = document.querySelector(".noRecordsDiv");
            const tableBody = document.querySelector(".tableBody");
            const table = document.querySelector(".table");
            tableBody.innerHTML = "";

            if (response.message.length === 0) {
                // If no records
                table.style.display = 'none';
                noRecordsDiv.style.display = 'flex';
                paginationDiv.style.display = 'none';
                noRecordsDiv.innerHTML = `<h4 class="text-purple-800 text-sm font-bold">${noRecordsMessage}</h4>`;
            } else {
                // If records are found
                table.style.display = 'block';
                noRecordsDiv.style.display = 'none';
                paginationDiv.style.display = 'flex';
                response.message.forEach((res, index) => {
                    checkDateDifferenceAndToggleButtons(res);
                    constructTable(res, index + 1, "tableBody");
                });

                togglePaginationButtons('Approved', response.message.length);
            }
        }
    });
}


// Function to toggle pagination buttons
function togglePaginationButtons(type, dataLength) {
    if (type === 'Approved') {
        document.querySelector(".prev-page-pending").disabled = currentPagePending === 1;
        document.querySelector(".next-page-pending").disabled = currentPagePending === totalPagesPending;
    }
}

// Function to add 30 minutes to a end time string in HH:MM format
function add30Minutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;

    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Utility function to create tables
function constructTable(data, slNo, tableName) {

    let tableBody = document.querySelector(`.${tableName}`);
    console.log("dataaa....", data);

    const checkboox = data.date


    let tableRow = document.createElement("tr");
    tableRow.classList.add("hover", "tableRow");


    // Parse the booking_time JSON string into an array
    const bookingTime = JSON.parse(data.booking_time);
    const startTime = bookingTime[0];
    let endTime = bookingTime[bookingTime.length - 1];

    // Add 30 minutes to the end time
    endTime = add30Minutes(endTime);

    // Formating Date
    let date = data.booking_date.split("-");
    date = `${date[2]}/${date[1]}/${date[0]}`;

    previousValueOfwaveOffAmount = data.wave_off_amount === 0 ? false : true;
    previousValueOfwaveOffComplimentary = data.wave_off_complimentary === 0 ? false : true;
    previousValueOfaccountVerification = data.verified_by_accounts === 0 ? false : true;

    let waveOffSection = document.getElementById(".wave_off_section");

    // Create the row with the provided data
    tableRow.setAttribute("onClick", `showDetails('${data.name}', '${startTime}', '${endTime}')`);
    tableRow.innerHTML = `
        <td>${slNo}</td>
        <td>${data.customer ? data.customer : data.customer_name}</td>
        <td>${date}</td>
        <td>${data.location}</td>
        <td>${data.room_type}</td>
        <td class="text-purple-800 font-medium">${data.room}</td>
        
        <td class="text-green-800 font-medium">${startTime}</td>
        <td class="text-red-800 font-medium">${endTime}</td>
        <td class="font-bold ${data.client_type && data.client_type !== 'Deposit' ? 'text-blue-700' : ''}">
            ${data.price}
        </td>
        <td>${data.wave_off_amount === 0 ? "No" : "Yes"}</td>
        <td>${data.wave_off_complimentary === 0 ? "No" : "Yes"}</td>
        <td>${data.verified_by_accounts === 0 ? "No" : "Yes"}</td>
       
    `;

    tableBody.appendChild(tableRow);

}
/*
*check box verification
*/

// Add null checks and provide fallback
const moneyWaveOff = document.getElementById("money_wave_off_checkbox");
const complementaryWaveOff = document.getElementById("complementary_wave_off_checkbox");
const accountVerificationBox = document.getElementById("accounts_verification_checkbox");

// Add null checks before adding event listeners
if (moneyWaveOff) {
    moneyWaveOff.addEventListener('change', (e) => {
        currentValueOfwaveOffAmount = e.target.checked;

        if (currentValueOfwaveOffAmount !== previousValueOfwaveOffAmount) {
            console.log("the condition is...... true");
            submitRecordBtn.disabled = false;
        }
        else {
            submitRecordBtn.disabled = true;
        }
        console.log("Event  = ", e.target.checked);
        console.log("previousValueOfwaveOffAmount  = ", previousValueOfwaveOffAmount);
    });
} else {
    console.error("Money Wave Off checkbox not found");
}

if (complementaryWaveOff) {
    complementaryWaveOff.addEventListener('change', (e) => {
        currentValueOfwaveOffComplimentary = e.target.checked;
        console.log("Event  = ", e.target.checked);
        console.log("previousValueOfwaveOffComplimentary = ", previousValueOfwaveOffComplimentary);
        submitRecordBtn.disabled = false;
    });
} else {
    console.error("Complementary Wave Off checkbox not found");
}

if (accountVerificationBox) {
    accountVerificationBox.addEventListener('change', (e) => {
        currentValueOfaccountVerification = e.target.value;
        console.log("Event  = ", e.target.checked);
        console.log("previousValueOfaccountVerification = ", previousValueOfaccountVerification);
        submitRecordBtn.disabled = false;
    });
} else {
    console.error("Account Verification checkbox not found");
}


if (submitRecordBtn) {
    // Initial state - disable submit button
    submitRecordBtn.disabled = true;
} else {
    console.error("Submit record button not found");
}

function checkCheckboxes() {
    if (submitRecordBtn) {
        submitRecordBtn.disabled = !(
            (moneyWaveOff && moneyWaveOff.checked) ||
            (complementaryWaveOff && complementaryWaveOff.checked) ||
            (previousValueOfaccountVerification && previousValueOfaccountVerification.checked)
        );
    }
}

function showDetails(id, startTime, endTime) {
    if (submitRecordBtn) {
        submitRecordBtn.disabled = true;
    }

    resetModalContent();
    startTimeToShow = startTime;
    endTimeToShow = endTime;
    my_modal_3.showModal();
    fetchSingleData(id);
}

// Update booking status
function updateStatus() {

    submitRecordBtn.disabled = true;
    //---------------utility Function ----------------------
    // Get the current date in yyyy-mm-dd format
    function getCurrentDate() {
        if (money_collected_value === "No") {
            return null;
        }
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
        return `${year}-${month}-${day}`;
    }
    //---------------utility Function ----------------------

    const currentDate = getCurrentDate();

    // Update the booking in the database
    // frappe.call({
    //     method: "frappe.client.set_value",
    //     args: {
    //         doctype: "Room Booking slot",
    //         name: PassId,
    //         fieldname: {
    //             "money_collected": money_collected_value,
    //             // "card_status": card_status_value,
    //             "money_collected_date": currentDate
    //         }
    //     },
    //     callback: function (response) {
    //         if (response) {
    //             // showToast("Successfully updated!");
    //             alert("Record updated successfully!");
    //             console.log("the cancallation details are...", response);

    //             money_collected.value = response.message.money_collected ? response.message.money_collected : "No";
    //             // card_status.value = response.message.card_status ? response.message.card_status : "Not issued";
    //             // window.location.reload();
    //         }
    //     }
    // });
}

//-----------------------------------------------second section--------------------------------------------------------//

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

    // Get the current date and the date two months ahead
    const currentDate = new Date();
    const twoMonthsAhead = new Date(currentDate);
    twoMonthsAhead.setMonth(currentDate.getMonth() + 2);

    // Check if selectedDate is more than 2 months ahead
    const selectedDateObj = new Date(selectedDate);
    if (selectedDateObj > twoMonthsAhead) {
        alert('You cannot book a date more than 2 months ahead.');
        const currentDateValue = currentDate.toISOString().split('T')[0];
        document.getElementById('booking_date').value = currentDateValue;
        newSlotsContainer.innerHTML = '';
        generateNewTimeSlots(currentDateValue);
        return;
    }

    // Clear existing slots
    newSlotsContainer.innerHTML = '';

    // Fetch booked slots for the selected date
    const bookedSlots = await fetchBookedSlots(location, roomType, room, selectedDate);

    const currentTime = currentDate.getTime();
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:30:00`);

    // Modified logic to round to the nearest 30-minute interval
    let start = (new Date(date).toDateString() === currentDate.toDateString()) ?
        new Date(currentTime) : startOfDay;

    // Round down to the nearest 30-minute interval
    const minutes = start.getMinutes();
    start.setMinutes(minutes >= 30 ? 30 : 0);

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

        // Calculate end time by adding 30 minutes
        const endHours = String(start.getHours() + Math.floor((start.getMinutes() + 30) / 60)).padStart(2, '0');
        const endMinutes = String((start.getMinutes() + 30) % 60).padStart(2, '0');
        const timeSlot = `${hours}:${minutes} to ${endHours}:${endMinutes}`;

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


// Function to fetch leads when a customer is selected
function fetchLeadsForCustomer(customerName) {

    // Fetch leads based on the selected customer name
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: 'Customer',
            fields: ['leads'], // Fetch the 'leads' field (assuming 'leads' is a field containing a list)
            filters: [['name', '=', customerName]], // Filter by customer name
        },
        callback: function (response) {
            const leadData = response.message.leads; // Assuming 'leads' is an array

            const leadSelectElement = document.getElementById('lead_id');
            if (leadData && leadData.length > 0) {
                leadSelectElement.innerHTML = '<option value="">Select Lead</option>'; // Clear previous options

                // Loop through each lead and append it to the select field
                leadData.forEach(lead => {
                    const option = document.createElement('option');
                    option.value = lead.leads;
                    option.textContent = lead.leads;
                    leadSelectElement.appendChild(option);
                    confirmed_locations.push(lead);
                });
            } else {
                leadSelectElement.innerHTML = '<option value="">No Lead id found</option>'
                alert('No leads found for this customer.');
            }
        }
    });
}

const customerName = document.getElementById('customer').value;

// Fetch form data for customer, location, room type, etc.
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

                        // If a customer is selected, fetch associated leads
                        if (doctype === 'Customer') {
                            fetchLeadsForCustomer(item[field]); // Fetch leads for selected customer
                        }
                    });

                    suggestionsElement.appendChild(suggestionItem);
                });
            }
        }
    });
}

/**
 * Fetches available room types dynamically based on the selected location.
 * 
 * This function uses a server-side call to retrieve a list of unique room types 
 * from the 'Rooms' doctype, filtered by the provided location. It then updates 
 * the UI to display the available room types in a dropdown menu and, if applicable,
 * fetches the available rooms for the selected room type.
 * 
 * @param {string} location - The location for which to fetch room types.
 *        This value is used to filter the rooms by location on the server.
 */
function fetchRoomTypes(location) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: 'Rooms', // The doctype to query
            fields: ['room_type'], // The field we need to fetch (room type)
            filters: [['location', '=', location]], // Filter by the selected location
            group_by: 'room_type' // Group results by room type
        },
        callback: function (response) {
            // Get the room type and room dropdown elements
            const roomTypeSelect = document.getElementById('room_type');
            roomTypeSelect.innerHTML = ''; // Clear existing room type options

            const roomSelectElement = document.getElementById('room');
            roomSelectElement.innerHTML = ''; // Clear existing room options

            if (response.message && response.message.length > 0) {
                // If there are available room types for the location
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.room_type;
                    option.textContent = item.room_type;
                    roomTypeSelect.appendChild(option);
                });

                // Trigger room type change to fetch initial rooms if any room types are available
                if (roomTypeSelect.options.length > 0) {
                    roomTypeSelect.selectedIndex = 0;
                    roomTypeSelect.dispatchEvent(new Event('change')); // Simulate a change event
                }
            } else {
                // If no room types are found for the location
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No Room Types found';
                roomTypeSelect.appendChild(option);

                // No rooms found for this location, update the room dropdown
                const roomOption = document.createElement('option');
                roomOption.value = '';
                roomOption.textContent = 'No rooms found';
                roomSelectElement.appendChild(roomOption);

                // Reset price per hour display to 0 if no rooms are available
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
            // fields: ['*'],
            filters: [
                ['name', '=', location],
            ]
        },
        callback: function (response) {
            const priceObj = response.message.room_type_details.find((room) => {
                if (room.room_type == roomType) {
                    return room.price_per_hour;
                }
            })
            roomPrice = priceObj ? priceObj.price_per_hour : 0;
            document.getElementById('price_per_hour').innerHTML = priceObj ? priceObj.price_per_hour : 0;
        }
    });
}

// Fetch static data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchFormData('Property Location', 'name', null); // No suggestions needed
    fetchFormData('Room Type', 'name', null); // No suggestions needed
    fetchFormDataHome('Property Location', 'name'); // Fetch locations
    fetchFormDataHome('Room Type', 'name'); // Fetch room types
});

// Event listeners for customer, lead, and email search fields
document.getElementById('customer').addEventListener('input', function () {
    const query = this.value;
    customer_name = this.value;
    fetchFormData('Customer', 'customer_name', 'customerSuggestions', [['customer_name', 'like', `%${query}%`]]);
});

// Function to fetch email options when a customer is selected
function fetchEmailsForCustomer(customerName) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "User",
            fields: ["name"],
            filters: [["customer", "=", customerName], ['app_user_type', '=', 'Property Customer']], // Filter by selected customer name
        },
        callback: function (response) {
            const emailSelectElement = document.getElementById('email');
            emailSelectElement.innerHTML = ''; // Clear previous options

            if (response.message.length > 0) {
                // Add email options if available
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = item.name;
                    emailSelectElement.appendChild(option);
                });
            } else {
                // If no emails are found, append "No emails found" option
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No emails found';
                emailSelectElement.appendChild(option);
            }
        }
    });
}

// Event listener for customer suggestions click
document.getElementById('customerSuggestions').addEventListener('click', function (event) {
    // Check if the clicked element is a suggestion
    if (event.target && event.target.matches('div.suggestion-item')) {
        const selectedCustomer = event.target.textContent; // Get customer name from the suggestion

        // Set the selected customer in the input field
        document.getElementById('customer').value = selectedCustomer;

        // Fetch emails for the selected customer
        fetchEmailsForCustomer(selectedCustomer);

        // Clear the suggestions after a selection
        const customerSuggestionsDiv = document.getElementById('customerSuggestions');
        customerSuggestionsDiv.innerHTML = ''; // Clear suggestions
    }
});

// Event listener for lead id change to show billing location
document.getElementById('lead_id').addEventListener('change', function () {
    const leadID = this.value;

    // Filter the confirmed_locations array to find the matching lead
    let lead = confirmed_locations.filter((lead) => {
        return lead.leads === leadID; // Ensure that 'lead.leads' matches 'leadID'
    });

    // Define the locations map
    let locations = {
        "NOW": "Novel Office Workhub - Whitefield",
        "NOC": "Novel Office Central - MG Road",
        "NBP": "Novel Business Park - Adugodi",
        "NOQ": "Novel Office Queens - Queens Road",
        "NOM": "Novel Office Marathahalli",
        "NTP": "Novel Tech Park - Kudlu Gate",
    }

    // Check if we found exactly one matching lead
    if (lead.length === 1) {
        // Assuming 'lead[0].confirmed_location' is the key for the location map
        const locationCode = lead[0].confirmed_location; // Update this to match the actual property in the 'lead' object
        if (locations[locationCode]) {
            document.getElementById('billing_location').innerHTML = locations[locationCode];
            Billing_location_of_client = locations[locationCode];
        } else {
            document.getElementById('billing_location').innerHTML = "Location not found.";
        }
    } else {
        console.error("Lead not found or multiple leads matched.");
    }
});


// document.getElementById('email').addEventListener('input', function () {
//     const query = this.value;
//     fetchFormData('User', 'name', 'emailSuggestions', [['app_user_type', '=', 'Property Customer'], ['customer', '=', `${customer_name}`]]);
// });

// Event listener for location and room type changes to fetch rooms based on filters
document.getElementById('location').addEventListener('change', function () {
    const selectedLocation = this.value;
    // Fetch room types specific to this location
    fetchRoomTypes(selectedLocation);
});

document.getElementById('room_type').addEventListener('change', function () {
    const selectedLocation = document.getElementById('location').value;
    const selectedRoomType = this.value;
    fetchRooms(selectedLocation, selectedRoomType);
    fetchPrice(selectedLocation, selectedRoomType);
});

// Function to fetch rooms based on selected location and room type
function fetchRooms(location, roomType) {

    const filters = [
        ['location', '=', location],
        ['room_type', '=', roomType]
    ];

    fetchFormData('Rooms', 'room_name', null, filters); // No suggestions needed for rooms
}

function getComplimentary(lead_id, user_room_type, date, price_per_hour, bookedHours) {
    // Get Complimentary available data
    frappe.call({
        method: "novelite.api.leads_details.get_new_complimentary",
        args: {
            lead_id: lead_id,
            user_room_type: user_room_type,
            date: date
        },
        callback: function (response) {
            if (response && response.message) {
                // Parse complimentary hours, defaulting to 0 if not available
                const complimentary_hours_available =
                    response.message.complimentary_avaliable === "No complimentary hours"
                        ? 0
                        : parseFloat(response.message.complimentary_avaliable || 0);

                let billableHours = 0;
                let price = 0;

                // Set total hours booked
                bookingData.total_hours = bookedHours;
                booked_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;

                // Set client type
                client_type_invoice.innerHTML = response.message.client_type || "---";

                // Handle complimentary hours for specific room types
                if (user_room_type === "Meeting Room" || user_room_type === "Conference Room" || user_room_type === "Board Room") {
                    complimentary_available.innerHTML = `${complimentary_hours_available} ${complimentary_hours_available < 2 ? "hr" : "hrs"}`;
                } else {
                    complimentary_hours_available = 0;
                    complimentary_available.innerHTML = "0 hr";
                }

                // Calculate billable hours and price
                if (complimentary_hours_available >= bookedHours) {
                    // Fully covered by complimentary hours
                    billableHours = 0;
                    total_price.innerHTML = "0";
                    billable_hours.innerHTML = "0 hr";
                    total_booking_price = 0;
                    bookingData.price = 0;
                } else {
                    // Partially covered by complimentary hours
                    billableHours = bookedHours - complimentary_hours_available;
                    billable_hours.innerHTML = `${billableHours} ${billableHours < 2 ? "hr" : "hrs"}`;

                    // Calculate price with GST
                    price = price_per_hour * billableHours;
                    let gst = price * 0.18;
                    let totalPrice = price + gst;

                    total_price.innerHTML = totalPrice.toFixed(2);
                    total_booking_price = totalPrice;
                    bookingData.price = totalPrice;
                }
            } else {
                // Fallback if no response
                complimentary_available.innerHTML = "0 hr";
                booked_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;
                billable_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;

                // Calculate full price
                let price = price_per_hour * bookedHours;
                let gst = price * 0.18;
                let totalPrice = price + gst;

                total_price.innerHTML = totalPrice.toFixed(2);
                total_booking_price = totalPrice;
                bookingData.price = totalPrice;
            }
        },
        error: function (err) {
            console.error("Error fetching Complimentary Details:", err);

            // Fallback error handling
            complimentary_available.innerHTML = "0 hr";
            booked_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;
            billable_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;

            let price = price_per_hour * bookedHours;
            let gst = price * 0.18;
            let totalPrice = price + gst;

            total_price.innerHTML = totalPrice.toFixed(2);
            total_booking_price = totalPrice;
            bookingData.price = totalPrice;
        }
    });
}
//Appends details to invoice modal
function showDetails_of_invoice(formData) {

    // Parse the booking_time JSON string into an array
    const bookingTime = formData.booking_time;

    const startTime = bookingTime[0].split(' to ')[0];

    let endTime = bookingTime[bookingTime.length - 1].split(' to ')[1] || (bookingTime[bookingTime.length - 1].includes(' to ')
        ? bookingTime[bookingTime.length - 1].split(' to ')[1]
        : bookingTime[bookingTime.length - 1]);


    //Showing details in invoice modal
    customer_invoice.innerHTML = formData.customer;
    email_invoice.innerHTML = formData.email;
    location_invoice.innerHTML = formData.location;
    lead_invoice.innerHTML = formData.lead_id;
    date_invoice.innerHTML = formData.booking_date;
    roomType_invoice.innerHTML = formData.room_type;
    roomname_invoice.innerHTML = formData.room;
    startTime_invoice.innerHTML = startTime;
    endTime_invoice.innerHTML = endTime;
    billing_location_invoice.innerHTML = Billing_location_of_client;

    bookingData = formData;
    const bookedHours = getSelectedSlots().length * 0.5;

    if (formData.room_type === "Meeting Room" || formData.room_type === "Conference Room") {
        getComplimentary(formData.lead_id, formData.room_type, formData.booking_date, formData.rate, bookedHours);
    } else {
        complimentary_available.innerHTML = "---"
        bookingData.total_hours = bookedHours;
        booked_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;

        billable_hours.innerHTML = `${bookedHours} ${bookedHours < 2 ? "hr" : "hrs"}`;
        price = formData.rate * bookedHours;

        total_price.innerHTML = price;
        total_booking_price = price;
        bookingData.price = price;

    }
    my_modal_3_invoice.showModal();
}

// Handle form submission
submitBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    // Collect form values
    const formData = {
        customer: document.getElementById('customer').value,
        lead_id: document.getElementById('lead_id').value,
        email: document.getElementById('email').value,
        location: document.getElementById('location').value,
        room_type: document.getElementById('room_type').value,
        room: document.getElementById('room').value,
        booking_date: document.getElementById('booking_date').value,
        booking_time: getSelectedSlots()  // Fetch the selected time slots
    };

    // Validate the form
    const validationError = validateForm(formData);
    if (validationError) {
        alert(validationError);
        return;
    }

    // Add the rate to form data (roomPrice is defined globally)
    formData.rate = roomPrice;
    showDetails_of_invoice(formData);

});

// Validate required fields
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
    return Array.from(selectedSlots).map(slot => {
        const times = slot.textContent.split(' to ');
        return times[0];
    });
}

//Confirm button click to create booking record
confirmBookingbtn.addEventListener("click", createNewBooking);

// Create new booking record
function createNewBooking() {
    if (bookingData.booking_time.length === 0) {
        alert("Please select at least one time slot!");
        return;
    }
    confirmBookingbtn.disabled = true;

    //---------------utility Function ----------------------
    // Get the current date in yyyy-mm-dd format
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

    const moneyCollectedValue = document.getElementById('money_collected_dropdown').value;
    const currentDate = getCurrentDate(moneyCollectedValue);
    const cardStatusValue = document.getElementById('card_status_dropdown').value;

    // Create the booking in the database
    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: {
                doctype: "Room Booking slot",
                customer: bookingData.customer,
                lead_id: bookingData.lead_id,
                status: 'Approved',
                email: bookingData.email,
                location: bookingData.location,
                billing_location: Billing_location_of_client,
                rate: bookingData.rate,
                price: bookingData.price,
                total_hours: bookingData.total_hours,
                room_type: bookingData.room_type,
                room: bookingData.location + ' - ' + bookingData.room,
                booking_date: bookingData.booking_date,
                booking_time: JSON.stringify(bookingData.booking_time),
                money_collected: moneyCollectedValue,
                money_collected_date: currentDate,
                card_status: cardStatusValue,
                block_temp: 0
            }
        },
        callback: function (response) {
            setTimeout(() => {
                location.reload(); // Reload the page after the toast
            }, 2000);
            if (response && response.message) {
                alert("Booking created successfully!");
                setTimeout(() => {
                    confirmBookingbtn.disabled = false;
                    location.reload(); // Reload the page after a delay
                }, 2000);
            } else {
                alert("Error creating booking!");
                confirmBookingbtn.disabled = false;
            }
        },
        error: function (err) {
            console.error("Error creating booking:", err);
            alert("Error creating booking!");
            confirmBookingbtn.disabled = false;
        }
    });
}

// ends here second-section || new booking //