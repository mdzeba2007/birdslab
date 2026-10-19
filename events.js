// ============================================================
// EVENTS GOOGLE SHEET API
// ============================================================

const EVENTS_API =
    "https://script.google.com/macros/s/AKfycbxbe2jNcLtEtUN3myTvIgZE_R_cscvcaWNXezXAIKY3hQgz2Ko3fpJGGf3FLGiDyXdA/exec";


// ============================================================
// LOAD EVENTS FROM GOOGLE SHEET
// ============================================================

async function loadEvents() {

    const eventsGrid =
        document.getElementById("eventsGrid");

    if (!eventsGrid) {
        console.error("eventsGrid not found.");
        return;
    }

    try {

        eventsGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #667f92;
                font-size: 18px;
            ">
                Loading events...
            </p>
        `;

        const response = await fetch(
            EVENTS_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Failed to fetch events.");
        }

        const data = await response.json();

        console.log("EVENTS DATA:", data);

        const events = (data.events || []).filter(function (event) {

            return String(event.Status || "")
                .trim()
                .toLowerCase() !== "inactive";

        });

        renderEvents(events);

    } catch (error) {

        console.error("EVENTS LOAD ERROR:", error);

        eventsGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: red;
                font-size: 18px;
            ">
                Unable to load events.
            </p>
        `;
    }
}


// ============================================================
// RENDER EVENTS
// ============================================================

function renderEvents(events) {

    const eventsGrid =
        document.getElementById("eventsGrid");

    if (!eventsGrid) return;

    eventsGrid.innerHTML = "";

    if (events.length === 0) {

        eventsGrid.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #667f92;
                font-size: 18px;
            ">
                No events available.
            </p>
        `;

        return;
    }

    events.forEach(function (event) {

        const card =
            createEventCard(event);

        eventsGrid.appendChild(card);

    });


    // Reconnect filters AFTER creating cards
    initializeFilters();
}


// ============================================================
// CREATE EVENT CARD
// ============================================================

function createEventCard(event) {

    const card =
        document.createElement("div");

    card.className = "event-card";


    // ========================================================
    // CATEGORY FOR FILTERING
    // ========================================================

    const category =
        String(event.Type || "event")
            .trim()
            .toLowerCase();

    card.setAttribute(
        "data-category",
        category
    );


    // ========================================================
    // TOP SECTION
    // ========================================================

    const top =
        document.createElement("div");

    top.className = "event-top";


    // EVENT TYPE

    const type =
        document.createElement("span");

    type.className =
        "event-type";

    type.textContent =
        event.Type || "Event";


    // ========================================================
    // STATUS
    // ========================================================

    const status =
        document.createElement("span");

    const statusText =
        String(event.Status || "")
            .trim();


    status.className =
        "event-status";


    if (
        statusText.toLowerCase() === "past"
    ) {

        status.classList.add("past");

    } else {

        status.classList.add("upcoming");

    }


    status.textContent =
        statusText || "Upcoming";


    top.appendChild(type);
    top.appendChild(status);


    // ========================================================
    // TITLE
    // ========================================================

    const title =
        document.createElement("h2");

    title.textContent =
        event.Title || "Untitled Event";


    // ========================================================
    // EVENT INFORMATION
    // ========================================================

    const info =
        document.createElement("div");

    info.className =
        "event-info";


    // DATE

    const dateParagraph =
        document.createElement("p");


    const dateIcon =
        document.createElement("i");

    dateIcon.className =
        "fa-regular fa-calendar";


    dateParagraph.appendChild(
        dateIcon
    );

    dateParagraph.appendChild(
        document.createTextNode(
            event.Date || ""
        )
    );


    // LOCATION

    const locationParagraph =
        document.createElement("p");


    const locationIcon =
        document.createElement("i");

    locationIcon.className =
        "fa-solid fa-location-dot";


    locationParagraph.appendChild(
        locationIcon
    );

    locationParagraph.appendChild(
        document.createTextNode(
            event.Location || ""
        )
    );


    info.appendChild(
        dateParagraph
    );

    info.appendChild(
        locationParagraph
    );


    // ========================================================
    // DESCRIPTION
    // ========================================================

    const description =
        document.createElement("p");

    description.className =
        "event-description";

    description.textContent =
        event.Description || "";


    // ========================================================
    // REGISTRATION LINK
    // ========================================================

    const registrationLink =
        String(
            event["Registration Link"] || ""
        ).trim();


    if (registrationLink !== "") {

        const registerButton =
            document.createElement("a");

        registerButton.className =
            "event-register";

        registerButton.href =
            registrationLink;

        registerButton.target =
            "_blank";

        registerButton.rel =
            "noopener noreferrer";

        registerButton.textContent =
            "Register →";


        card.appendChild(
            registerButton
        );
    }


    // ========================================================
    // ADD EVERYTHING TO CARD
    // ========================================================

    card.appendChild(top);

    card.appendChild(title);

    card.appendChild(info);

    card.appendChild(description);


    return card;
}


// ============================================================
// FILTER SYSTEM
// ============================================================

function initializeFilters() {

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const eventCards =
        document.querySelectorAll(".event-card");


    // If there are no filter buttons,
    // simply continue normally.

    if (filterButtons.length === 0) {
        return;
    }


    filterButtons.forEach(function (button) {

        // Prevent adding duplicate listeners
        button.onclick = function () {

            // Remove active from all buttons

            filterButtons.forEach(
                function (btn) {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            // Make clicked button active

            button.classList.add(
                "active"
            );


            // Get selected category

            const filterValue =
                String(
                    button.getAttribute(
                        "data-filter"
                    ) || "all"
                )
                .trim()
                .toLowerCase();


            // Filter cards

            eventCards.forEach(
                function (card) {

                    const cardCategory =
                        String(
                            card.getAttribute(
                                "data-category"
                            ) || ""
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        filterValue === "all" ||
                        filterValue === cardCategory
                    ) {

                        card.classList.remove(
                            "hide"
                        );

                    } else {

                        card.classList.add(
                            "hide"
                        );

                    }

                }
            );

        };

    });
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Initialize Lucide icons if available

        if (
            typeof lucide !== "undefined" &&
            typeof lucide.createIcons === "function"
        ) {

            lucide.createIcons();

        }


        // Load events from Google Sheet

        loadEvents();

    }
);