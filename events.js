
const EVENTS_API =
    "https://script.google.com/macros/s/AKfycbxbe2jNcLtEtUN3myTvIgZE_R_cscvcaWNXezXAIKY3hQgz2Ko3fpJGGf3FLGiDyXdA/exec";
    // Convert dates into a consistent format
function parseEventDate(dateString) {
    if (!dateString) return null;

    const value = String(dateString).trim();

    // Handle dates such as March 17-18, 2028
    const rangeMatch = value.match(
        /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2}),?\s*(\d{4})$/i
    );

    if (rangeMatch) {
        const month = new Date(
            `${rangeMatch[1]} 1, ${rangeMatch[4]}`
        ).getMonth();

        return {
            start: new Date(
                Number(rangeMatch[4]),
                month,
                Number(rangeMatch[2])
            ),
            end: new Date(
                Number(rangeMatch[4]),
                month,
                Number(rangeMatch[3])
            )
        };
    }

    // Handle dates such as March 17, 2028
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return {
            start: new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate()
            ),
            end: new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate()
            )
        };
    }

    return null;
}

let allEvents = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("eventDate")
        .addEventListener("change", applyFilters);

    document.getElementById("eventYear")
        .addEventListener("change", applyFilters);

    document.getElementById("eventCategory")
        .addEventListener("change", applyFilters);

    document.getElementById("clearFilters")
        .addEventListener("click", clearFilters);

    loadEvents();
});


// Parse common date formats, including March 17-18, 2027.
function parseEventDate(value) {
    if (!value) return null;

    const text = String(value).trim();

    const rangeMatch = text.match(
        /^([A-Za-z]+)\s+(\d{1,2})(?:\s*[-–]\s*\d{1,2})?,?\s*(\d{4})$/
    );

    let date;

    if (rangeMatch) {
        date = new Date(
            `${rangeMatch[1]} ${rangeMatch[2]}, ${rangeMatch[3]}`
        );
    } else {
        date = new Date(text);
    }

    if (Number.isNaN(date.getTime())) return null;

    // Compare calendar dates without time-of-day differences.
    date.setHours(0, 0, 0, 0);

    return date;
}


// Normalize event categories.
function getCategory(event) {
    const type = String(event.Type || "")
        .trim()
        .toLowerCase();

    if (type.includes("conference")) return "conference";
    if (type.includes("workshop")) return "workshop";
    if (type.includes("seminar")) return "seminar";

    return "other";
}


// Determine whether an event is past or upcoming.
function getEventStatus(event) {
    const date = parseEventDate(event.Date);

    if (date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date < today ? "past" : "upcoming";
    }

    // Fall back to the Google Sheet Status column
    // when the date cannot be parsed.
    const status = String(event.Status || "")
        .trim()
        .toLowerCase();

    return status === "past" ? "past" : "upcoming";
}


// Load events from Google Sheets.
async function loadEvents() {
    const upcomingGrid =
        document.getElementById("upcomingEventsGrid");

    const pastGrid =
        document.getElementById("pastEventsGrid");

    try {
        const response = await fetch(
            EVENTS_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Failed to fetch events.");
        }

        const data = await response.json();

        allEvents = (data.events || []).filter(event =>
            String(event.Status || "")
                .trim()
                .toLowerCase() !== "inactive"
        );

        populateYears();
        applyFilters();

    } catch (error) {
        console.error("Events loading error:", error);

        upcomingGrid.innerHTML =
            '<p class="events-message">Unable to load upcoming events.</p>';

        pastGrid.innerHTML =
            '<p class="events-message">Unable to load past events.</p>';
    }
}


// Populate year options from available event dates.
function populateYears() {
    const yearSelect = document.getElementById("eventYear");

    const years = [
        ...new Set(
            allEvents
                .map(event => parseEventDate(event.Date))
                .filter(Boolean)
                .map(date => date.getFullYear())
        )
    ].sort((a, b) => a - b);

    yearSelect.innerHTML =
        '<option value="all">All years</option>';

    years.forEach(year => {
        const option = document.createElement("option");

        option.value = String(year);
        option.textContent = String(year);

        yearSelect.appendChild(option);
    });
}


// Apply date, year, and category filters.
function applyFilters() {
    const selectedDate =
        document.getElementById("eventDate").value;

    const selectedYear =
        document.getElementById("eventYear").value;

    const selectedCategory =
        document.getElementById("eventCategory").value;

    const filteredEvents = allEvents.filter(event => {
        const date = parseEventDate(event.Date);

        
if (selectedDate) {
    if (!date) {
        return false;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const eventDate =
        `${year}-${month}-${day}`;

    if (eventDate !== selectedDate) {
        return false;
    }
}


        if (selectedYear !== "all") {
            if (!date || date.getFullYear() !== Number(selectedYear)) {
                return false;
            }
        }

        if (
            selectedCategory !== "all" &&
            getCategory(event) !== selectedCategory
        ) {
            return false;
        }

        return true;
    });

    renderEvents(filteredEvents);
}


// Render upcoming and past events separately.
function renderEvents(events) {
    const upcomingGrid =
        document.getElementById("upcomingEventsGrid");

    const pastGrid =
        document.getElementById("pastEventsGrid");

    upcomingGrid.innerHTML = "";
    pastGrid.innerHTML = "";

    const upcoming = events
        .filter(event => getEventStatus(event) === "upcoming")
        .sort((a, b) =>
            (parseEventDate(a.Date)?.getTime() || 0) -
            (parseEventDate(b.Date)?.getTime() || 0)
        );

    const past = events
        .filter(event => getEventStatus(event) === "past")
        .sort((a, b) =>
            (parseEventDate(b.Date)?.getTime() || 0) -
            (parseEventDate(a.Date)?.getTime() || 0)
        );

    renderEventGroup(upcoming, upcomingGrid, "No upcoming events match your filters.");
    renderEventGroup(past, pastGrid, "No past events match your filters.");
}


// Create event cards.
function renderEventGroup(events, grid, emptyMessage) {
    if (events.length === 0) {
        const message = document.createElement("p");
        message.className = "events-message";
        message.textContent = emptyMessage;
        grid.appendChild(message);
        return;
    }

    events.forEach(event => {
        grid.appendChild(createEventCard(event));
    });
}


function createEventCard(event) {
    const card = document.createElement("article");
    card.className = "event-card";

    const top = document.createElement("div");
    top.className = "event-top";

    const type = document.createElement("span");
    type.className = "event-type";
    type.textContent = event.Type || "Other Event";

    const status = document.createElement("span");
    status.className = "event-status " + getEventStatus(event);
    status.textContent =
        getEventStatus(event) === "past" ? "Past" : "Upcoming";

    top.append(type, status);

    const title = document.createElement("h2");
    title.textContent = event.Title || "Untitled Event";

    const info = document.createElement("div");
    info.className = "event-info";

    const date = document.createElement("p");
    const dateIcon = document.createElement("i");
    dateIcon.className = "fa-regular fa-calendar";
    date.append(dateIcon, document.createTextNode(" " + (event.Date || "Date not specified")));

    const location = document.createElement("p");
    const locationIcon = document.createElement("i");
    locationIcon.className = "fa-solid fa-location-dot";
    location.append(locationIcon, document.createTextNode(" " + (event.Location || "Location not specified")));

    info.append(date, location);

    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.Description || "";

    card.append(top, title, info, description);

    const registrationLink =
        String(event["Registration Link"] || "").trim();

    if (registrationLink) {
        try {
            const url = new URL(registrationLink);

            if (url.protocol === "https:" || url.protocol === "http:") {
                const button = document.createElement("a");

                button.className = "event-register";
                button.href = url.href;
                button.target = "_blank";
                button.rel = "noopener noreferrer";
                button.textContent = "Register →";

                card.appendChild(button);
            }
        } catch (error) {
            console.warn("Invalid registration URL:", registrationLink);
        }
    }

    return card;
}


// Reset all filters.
function clearFilters() {
    document.getElementById("eventDate").value = "";
    document.getElementById("eventYear").value = "all";
    document.getElementById("eventCategory").value = "all";

    applyFilters();
}
