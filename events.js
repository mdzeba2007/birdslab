// ============================================================
// EVENTS GOOGLE SHEET API & STORAGE KEYS
// ============================================================

const EVENTS_API =
    "https://script.google.com/macros/s/AKfycbxbe2jNcLtEtUN3myTvIgZE_R_cscvcaWNXezXAIKY3hQgz2Ko3fpJGGf3FLGiDyXdA/exec";

const EVENTS_STORAGE_KEY = "birdlab_custom_events";
const REGISTRATIONS_STORAGE_KEY = "birdlab_event_registrations";
const CONNECTED_SHEET_URL = "https://docs.google.com/spreadsheets/d/1CSlzKRnWN2CtiKCHTJUowHMF13_MdQBHNAUml7ouAvI/edit?gid=0#gid=0";
const ADMIN_NOTIFICATION_EMAIL = "nextgenlab1234@gmail.com";

// ============================================================
// DIVERSE LAB GALLERY (EACH EVENT RECEIVES A UNIQUE PICTURE)
// ============================================================

const UNIQUE_LAB_GALLERY = [
    { key: "iitj_campus", src: "iitj_campus_hd.jpg", title: "IIT Jodhpur Permanent Campus" },
    { key: "bio_flight", src: "bio-inspired.jpg", title: "Bio-Inspired Flapping Robot" },
    { key: "exoskeleton", src: "wearable-robotics.jpg", title: "Wearable Bionic Exoskeleton" },
    { key: "rehab_treadmill", src: "wheelchair-treadmill.png", title: "Rehabilitation Gait Platform" },
    { key: "autonomous_rover", src: "c2.jpeg", title: "Autonomous Mobile Robotics" },
    { key: "ai_manipulator", src: "applied-ai-robotics.jpg", title: "Vision-Guided AI Robot Arm" },
    { key: "teleoperation", src: "tele-robotics.jpg", title: "Haptic Bilateral Tele-Robotics" },
    { key: "wing_aero", src: "research1.jpg", title: "Flapping Wing Aerodynamics" },
    { key: "pratham_platform", src: "pratham3.0.png", title: "Pratham 3.0 Autonomous Rover" },
    { key: "micro_fabrication", src: "phrozen-mega-8k.png", title: "8K Additive Prototyping" },
    { key: "sensor_rig", src: "research2.jpg", title: "Neuromorphic Sensor Rig" },
    { key: "actuators", src: "cubemars-ak.png", title: "High-Torque Bionic Actuator" }
];

// ============================================================
// SMART IMAGE RESOLVER (GUARANTEES DISTINCT, UNIQUE IMAGES)
// ============================================================

function resolveEventPoster(event, fallbackIndex = 0) {
    if (!event) return UNIQUE_LAB_GALLERY[fallbackIndex % UNIQUE_LAB_GALLERY.length].src;

    let poster = String(event.Poster || event["Poster Link"] || "").trim();

    // 1. Google Drive Share URL -> Direct High-Res Image Stream
    if (poster.includes("drive.google.com")) {
        const fileIdMatch =
            poster.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
            poster.match(/id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        }
    }

    // 2. Clean double extension if present
    if (poster.endsWith(".jpg.jpeg")) {
        poster = poster.replace(/\.jpg\.jpeg$/, ".jpg");
    }

    // 3. If explicit custom image or base64 data URL provided and it's not a generic default, keep it
    if (poster !== "" && !poster.includes("undefined") && !poster.includes("null")) {
        return poster;
    }

    // 4. Content-aware assignment of DISTINCT images per event
    const title = String(event.Title || "").toLowerCase();
    const type = String(event.Type || "").toLowerCase();

    // Event-specific mapping to guarantee zero duplicate images
    if (title.includes("international robotics conference") || (title.includes("conference") && title.includes("international"))) {
        return "iitj_campus_hd.jpg"; // Grand IITJ campus landmark
    }
    if (title.includes("workshop on wearable") || title.includes("wearable robotics & exoskeletons")) {
        return "wheelchair-treadmill.png"; // Instrumented gait testing
    }
    if (title.includes("chen") || title.includes("sarah") || title.includes("future of bio-inspired")) {
        return "c2.jpeg"; // Distinguished MIT speaker keynote presentation
    }
    if (title.includes("winter school") || title.includes("neuromorphic")) {
        return "bio-inspired.jpg"; // Avian biomimetic robot
    }
    if (title.includes("symposium on wearable") || title.includes("assistive robotics")) {
        return "wearable-robotics.jpg"; // Full human exoskeleton suit
    }
    if (title.includes("applied ai") || title.includes("manipulation")) {
        return "applied-ai-robotics.jpg"; // 6-DOF industrial robot arm
    }
    if (title.includes("tele-robotics") || title.includes("teleoperation") || title.includes("haptic")) {
        return "tele-robotics.jpg"; // Master-slave teleoperation station
    }
    if (title.includes("bird flight") || title.includes("mechanics of bird")) {
        return "research1.jpg"; // Flapping wing aerodynamic wind tunnel
    }
    if (title.includes("pratham") || title.includes("ground robot")) {
        return "pratham3.0.png"; // Autonomous mobile platform
    }
    if (title.includes("additive") || title.includes("fabrication") || title.includes("prototyping")) {
        return "phrozen-mega-8k.png"; // 8K precision micro-manufacturing
    }

    // 5. Fallback from unique gallery by sequential index (guarantees diverse images)
    return UNIQUE_LAB_GALLERY[fallbackIndex % UNIQUE_LAB_GALLERY.length].src;
}

// ============================================================
// DEFAULT LAB EVENTS (10 EVENTS, 10 COMPLETELY UNIQUE PICTURES)
// ============================================================

const DEFAULT_LAB_EVENTS = [
    {
        id: "evt_101",
        Title: "International Robotics Conference 2026",
        Type: "Conference",
        Status: "Upcoming",
        Date: "March 17-18, 2027",
        Time: "09:00 AM - 06:00 PM IST",
        Location: "IIT Jodhpur Permanent Campus, India",
        "Registration Link": "",
        Description: "Annual flagship international robotics conference featuring keynote speakers, plenary tracks, and live demonstrations of cutting-edge robotics research.",
        Poster: "iitj_campus_hd.jpg"
    },
    {
        id: "evt_102",
        Title: "Workshop on Wearable Robotics & Exoskeletons",
        Type: "Workshop",
        Status: "Upcoming",
        Date: "March 17-18, 2028",
        Time: "10:00 AM - 05:00 PM IST",
        Location: "BIRD Lab, IIT Jodhpur",
        "Registration Link": "",
        Description: "Hands-on workshop exploring sensorimotor rehabilitation, instrumented motion-capture treadmills, and robotic exoskeleton assistive platforms.",
        Poster: "wheelchair-treadmill.png"
    },
    {
        id: "evt_103",
        Title: "Guest Lecture: Future of Bio-Inspired Mechanisms",
        Type: "Guest Lecture",
        Status: "Upcoming",
        Date: "March 17-18, 2029",
        Time: "03:30 PM - 05:00 PM IST",
        Location: "Online via Webex / SAIDE Hall",
        "Registration Link": "",
        Description: "Distinguished keynote lecture by Dr. Sarah Chen from MIT on biomimetic actuators, morphological computation, and compliant mechanisms.",
        Poster: "c2.jpeg"
    },
    {
        id: "evt_104",
        Title: "International Winter School on Bio-Inspired Robotics & Neuromorphic Systems",
        Type: "Workshop",
        Status: "Upcoming",
        Date: "November 18-22, 2026",
        Time: "09:30 AM - 05:00 PM IST",
        Location: "SAIDE Seminar Hall & Robotics Lab, IIT Jodhpur",
        "Registration Link": "",
        Description: "Hands-on masterclass exploring avian locomotion, soft actuators, neuromorphic tactile perception, and bio-inspired flight dynamics led by distinguished international researchers.",
        Poster: "bio-inspired.jpg"
    },
    {
        id: "evt_105",
        Title: "Symposium on Assistive Robotics & Human-Machine Interfacing",
        Type: "Symposium",
        Status: "Upcoming",
        Date: "December 08, 2026",
        Time: "10:00 AM - 04:30 PM IST",
        Location: "Auditorium Complex, IIT Jodhpur Permanent Campus",
        "Registration Link": "",
        Description: "A premier gathering of roboticists, clinicians, and biomedical engineers discussing human-robot sensorimotor interfacing, biomechanics, and rehabilitation exoskeletons.",
        Poster: "wearable-robotics.jpg"
    },
    {
        id: "evt_106",
        Title: "Applied AI in Robotics & Autonomous Robotic Manipulation",
        Type: "Conference",
        Status: "Upcoming",
        Date: "January 14-16, 2027",
        Time: "09:00 AM - 06:00 PM IST",
        Location: "IIT Jodhpur Permanent Campus & Virtual Hybrid",
        "Registration Link": "",
        Description: "Focusing on reinforcement learning for quadrupeds, vision-language-action (VLA) foundation models for manipulation, and sim-to-real transfer.",
        Poster: "applied-ai-robotics.jpg"
    },
    {
        id: "evt_107",
        Title: "National Workshop on Tele-Robotics & Haptic Teleoperation Systems",
        Type: "Workshop",
        Status: "Past",
        Date: "October 10-12, 2026",
        Time: "10:00 AM - 05:00 PM IST",
        Location: "BIRDLab Robotics Experimental Facility, IIT Jodhpur",
        "Registration Link": "",
        Description: "Participants explored bilateral teleoperation architectures, force feedback bilateral control, and high-fidelity haptic rendering for extreme environments.",
        Poster: "tele-robotics.jpg"
    },
    {
        id: "evt_108",
        Title: "Distinguished Lecture: Bio-Mechanics of Bird Flight & Flapping Wings",
        Type: "Guest Lecture",
        Status: "Past",
        Date: "August 24, 2026",
        Time: "03:30 PM - 05:00 PM IST",
        Location: "Virtual Seminar via Webex / SAIDE Hall",
        "Registration Link": "",
        Description: "Special invited lecture by Dr. Bhivraj Suthar and guest keynote speakers on unsteady aerodynamics and morphological computation in avian robotics.",
        Poster: "research1.jpg"
    },
    {
        id: "evt_109",
        Title: "Pratham 3.0 Autonomous Ground Robot Field Demonstration",
        Type: "Symposium",
        Status: "Past",
        Date: "July 15, 2026",
        Time: "11:00 AM - 03:00 PM IST",
        Location: "Outdoor Robotics Testing Grounds, IIT Jodhpur",
        "Registration Link": "",
        Description: "Live field trial and operational demonstration of the Pratham 3.0 autonomous all-terrain mobile robot with multi-modal LiDAR SLAM.",
        Poster: "pratham3.0.png"
    },
    {
        id: "evt_110",
        Title: "Masterclass on 3D Additive Fabrication & Micro-Prototyping",
        Type: "Workshop",
        Status: "Past",
        Date: "May 20, 2026",
        Time: "09:30 AM - 04:30 PM IST",
        Location: "BIRDLab Fabrication Suite, IIT Jodhpur",
        "Registration Link": "",
        Description: "Intensive training on sub-micron resin additive manufacturing and high-precision rapid prototyping for biomimetic robot components.",
        Poster: "phrozen-mega-8k.png"
    }
];

// Current State
let allLoadedEvents = [];
let activeSectionTab = "all";
let activeCategoryFilter = "all";
let currentSearchQuery = "";

// ============================================================
// LOAD EVENTS CONTROLLER
// ============================================================

async function loadEvents() {
    const upcomingGrid = document.getElementById("upcomingEventsGrid");
    const pastGrid = document.getElementById("pastEventsGrid");

    if (upcomingGrid) {
        upcomingGrid.innerHTML = `
            <div class="events-loading-spinner">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading upcoming events...</p>
            </div>
        `;
    }

    if (pastGrid) {
        pastGrid.innerHTML = `
            <div class="events-loading-spinner">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading past activities...</p>
            </div>
        `;
    }

    // 1. Check local storage from admin panel
    let localEvents = null;
    try {
        const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
        if (stored) {
            localEvents = JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Notice: Error parsing local stored events:", e);
    }

    // 2. Fetch live Google Sheet events in parallel
    let sheetEvents = [];
    try {
        const response = await fetch(EVENTS_API + "?t=" + Date.now());
        if (response.ok) {
            const data = await response.json();
            sheetEvents = (data.events || []).filter(function (event) {
                return String(event.Status || "").trim().toLowerCase() !== "inactive";
            });
        }
    } catch (error) {
        console.warn("Notice: Google Sheets API unreachable, using local lab data.", error);
    }

    // 3. Assemble events list
    let finalEvents = [];

    if (Array.isArray(localEvents) && localEvents.length > 0) {
        finalEvents = [...localEvents];

        // Merge any sheet events not in local
        sheetEvents.forEach(function (sheetItem, sIdx) {
            const exists = finalEvents.some(function (evt) {
                return (
                    evt.Title &&
                    sheetItem.Title &&
                    evt.Title.trim().toLowerCase() === sheetItem.Title.trim().toLowerCase()
                );
            });

            if (!exists) {
                const sheetEvt = {
                    id: "evt_sheet_" + Math.random().toString(36).substring(2, 9),
                    Title: sheetItem.Title || "Untitled Event",
                    Type: sheetItem.Type || "Event",
                    Status: sheetItem.Status && sheetItem.Status.toLowerCase() === "past" ? "Past" : "Upcoming",
                    Date: sheetItem.Date || "",
                    Time: sheetItem.Time || "",
                    Location: sheetItem.Location || "",
                    "Registration Link": sheetItem["Registration Link"] || "",
                    Description: sheetItem.Description || "",
                    Poster: sheetItem.Poster || sheetItem["Poster Link"] || ""
                };
                sheetEvt.Poster = resolveEventPoster(sheetEvt, sIdx);
                finalEvents.push(sheetEvt);
            }
        });
    } else if (sheetEvents.length > 0) {
        finalEvents = sheetEvents.map(function (sheetItem, idx) {
            const sheetEvt = {
                id: "evt_sheet_" + idx,
                Title: sheetItem.Title || "Untitled Event",
                Type: sheetItem.Type || "Event",
                Status: sheetItem.Status && sheetItem.Status.toLowerCase() === "past" ? "Past" : "Upcoming",
                Date: sheetItem.Date || "",
                Time: sheetItem.Time || "",
                Location: sheetItem.Location || "",
                "Registration Link": sheetItem["Registration Link"] || "",
                Description: sheetItem.Description || "",
                Poster: sheetItem.Poster || sheetItem["Poster Link"] || ""
            };
            sheetEvt.Poster = resolveEventPoster(sheetEvt, idx);
            return sheetEvt;
        });

        // Complement with lab default past events so archive is rich
        DEFAULT_LAB_EVENTS.filter(e => e.Status === "Past").forEach(p => {
            const exists = finalEvents.some(f => f.Title.toLowerCase() === p.Title.toLowerCase());
            if (!exists) finalEvents.push(p);
        });
    } else {
        // Fallback default events
        finalEvents = [...DEFAULT_LAB_EVENTS];
    }

    // 4. Strict Deduplication of Images: Ensure every single event has a UNIQUE poster
    const usedImages = new Set();
    finalEvents.forEach(function (evt, idx) {
        let poster = resolveEventPoster(evt, idx);

        // If this image was already assigned to a previous event, pick next unused from gallery
        if (usedImages.has(poster)) {
            const unused = UNIQUE_LAB_GALLERY.find(g => !usedImages.has(g.src));
            if (unused) {
                poster = unused.src;
            }
        }

        evt.Poster = poster;
        usedImages.add(poster);

        // Sanitize any generic Google Forms links from previous sessions
        const rawLink = String(evt["Registration Link"] || "").trim();
        if (
            rawLink === "https://docs.google.com/forms" ||
            rawLink === "https://docs.google.com/forms/" ||
            rawLink === "https://docs.google.com/forms/u/0" ||
            rawLink === "https://docs.google.com/forms/u/0/"
        ) {
            evt["Registration Link"] = "";
        }
    });

    // Save back to localStorage so user gets permanent unique pictures
    try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(finalEvents));
    } catch (e) {}

    allLoadedEvents = finalEvents;
    console.log("TOTAL EVENTS LOADED (ALL UNIQUE PICTURES):", allLoadedEvents.length);

    // Render separated upcoming and past events
    renderOrganizedEvents();

    // Initialize interactive tabs, search, and category pills
    setupInteractiveControls();

    // Initialize poster lightbox modal
    setupPosterLightboxModal();

    // Initialize course & event registration modal
    setupEventRegistrationModal();
}

// ============================================================
// RENDER ORGANIZED UPCOMING & PAST EVENTS
// ============================================================

function renderOrganizedEvents() {
    const upcomingGrid = document.getElementById("upcomingEventsGrid");
    const pastGrid = document.getElementById("pastEventsGrid");
    const upcomingSection = document.getElementById("upcomingSection");
    const pastSection = document.getElementById("pastSection");

    const tabCountAll = document.getElementById("tabCountAll");
    const tabCountUpcoming = document.getElementById("tabCountUpcoming");
    const tabCountPast = document.getElementById("tabCountPast");
    const upcomingCountBadge = document.getElementById("upcomingCountBadge");
    const pastCountBadge = document.getElementById("pastCountBadge");

    if (!upcomingGrid || !pastGrid) return;

    // Filter events based on active category and search query
    const filteredEvents = allLoadedEvents.filter(function (event) {
        // Category filter
        const category = String(event.Type || "event").trim().toLowerCase();
        if (activeCategoryFilter !== "all" && !category.includes(activeCategoryFilter)) {
            return false;
        }

        // Search query
        if (currentSearchQuery) {
            const title = String(event.Title || "").toLowerCase();
            const desc = String(event.Description || "").toLowerCase();
            const loc = String(event.Location || "").toLowerCase();
            const date = String(event.Date || "").toLowerCase();
            const type = String(event.Type || "").toLowerCase();

            const matches =
                title.includes(currentSearchQuery) ||
                desc.includes(currentSearchQuery) ||
                loc.includes(currentSearchQuery) ||
                date.includes(currentSearchQuery) ||
                type.includes(currentSearchQuery);

            if (!matches) return false;
        }

        return true;
    });

    // Separate into Upcoming and Past arrays
    const upcomingEvents = filteredEvents.filter(function (event) {
        return String(event.Status || "").trim().toLowerCase() === "upcoming";
    });

    const pastEvents = filteredEvents.filter(function (event) {
        return String(event.Status || "").trim().toLowerCase() === "past";
    });

    // Update Counts
    const totalCount = allLoadedEvents.length;
    const totalUpcoming = allLoadedEvents.filter(e => String(e.Status || "").toLowerCase() === "upcoming").length;
    const totalPast = allLoadedEvents.filter(e => String(e.Status || "").toLowerCase() === "past").length;

    if (tabCountAll) tabCountAll.textContent = totalCount;
    if (tabCountUpcoming) tabCountUpcoming.textContent = totalUpcoming;
    if (tabCountPast) tabCountPast.textContent = totalPast;

    if (upcomingCountBadge) upcomingCountBadge.textContent = `${upcomingEvents.length} Event${upcomingEvents.length === 1 ? "" : "s"}`;
    if (pastCountBadge) pastCountBadge.textContent = `${pastEvents.length} Event${pastEvents.length === 1 ? "" : "s"}`;

    // Visibility based on active Section Tab
    if (upcomingSection && pastSection) {
        if (activeSectionTab === "upcoming") {
            upcomingSection.style.display = "block";
            pastSection.style.display = "none";
        } else if (activeSectionTab === "past") {
            upcomingSection.style.display = "none";
            pastSection.style.display = "block";
        } else {
            upcomingSection.style.display = "block";
            pastSection.style.display = "block";
        }
    }

    // Render Upcoming Grid
    upcomingGrid.innerHTML = "";
    if (upcomingEvents.length === 0) {
        upcomingGrid.innerHTML = `
            <div class="empty-events-state">
                <i class="fa-regular fa-calendar-check"></i>
                <h3>No Upcoming Events</h3>
                <p>There are no upcoming events matching your criteria right now. Check back soon for announcements or explore our past activities archive below.</p>
            </div>
        `;
    } else {
        upcomingEvents.forEach(function (event, i) {
            upcomingGrid.appendChild(createEventCard(event, true, i));
        });
    }

    // Render Past Grid
    pastGrid.innerHTML = "";
    if (pastEvents.length === 0) {
        pastGrid.innerHTML = `
            <div class="empty-events-state">
                <i class="fa-solid fa-box-archive"></i>
                <h3>No Past Events Found</h3>
                <p>No past events match the current filter or search criteria.</p>
            </div>
        `;
    } else {
        pastEvents.forEach(function (event, i) {
            pastGrid.appendChild(createEventCard(event, false, i));
        });
    }

    // Attach registration modal handlers to newly rendered cards
    setupEventRegistrationModal();
}

// ============================================================
// CREATE EVENT CARD (HIGH-CLARITY DISPLAY & VIEWING)
// ============================================================

function createEventCard(event, isUpcoming, index) {
    const card = document.createElement("div");
    card.className = "event-card";

    const category = String(event.Type || "event").trim().toLowerCase();
    card.setAttribute("data-category", category);

    // Resolved distinct poster
    const posterUrl = resolveEventPoster(event, index);

    // 1. CLEAR POSTER FLYER BANNER (object-fit: contain ensures NO cropping)
    const posterHtml = `
        <div class="event-poster-wrapper" data-poster-src="${escapeAttr(posterUrl)}" data-poster-title="${escapeAttr(event.Title || 'Event Poster')}" title="Click to view full flyer clearly">
            <img
                src="${escapeAttr(posterUrl)}"
                alt="${escapeAttr(event.Title || 'Event Poster Flyer')}"
                class="event-poster-image"
                loading="lazy"
                onerror="this.onerror=null; this.src='iitj_campus_hd.jpg';"
            >
            <div class="event-poster-overlay">
                <span class="poster-zoom-btn">
                    <i class="fa-solid fa-magnifying-glass-plus"></i> View Full Poster
                </span>
            </div>
        </div>
    `;

    // 2. METADATA ROW
    const typeLabel = event.Type || "Event";
    const statusLabel = isUpcoming ? "Upcoming" : "Past Activity";
    const statusClass = isUpcoming ? "upcoming" : "past";

    // 3. REGISTRATION & FULL POSTER ACTION BUTTONS
    const registrationLink = String(event["Registration Link"] || "").trim();
    let actionButtonsHtml = "";

    // For any upcoming event (or any event with an active registration link), show the interactive Register Now button
    const isGenericLink =
        registrationLink === "https://docs.google.com/forms" ||
        registrationLink === "https://docs.google.com/forms/" ||
        registrationLink === "https://docs.google.com/forms/u/0" ||
        registrationLink === "https://docs.google.com/forms/u/0/";
    const customLink = isGenericLink ? "" : registrationLink;

    if (isUpcoming || customLink !== "") {
        actionButtonsHtml += `
            <button
                type="button"
                class="event-register-btn"
                data-event-id="${escapeAttr(event.id || '')}"
                data-event-title="${escapeAttr(event.Title || 'Lab Course / Event')}"
                data-event-type="${escapeAttr(typeLabel)}"
                data-event-date="${escapeAttr(event.Date || '')}"
                data-event-location="${escapeAttr(event.Location || '')}"
                data-custom-link="${escapeAttr(customLink)}"
                title="Register for ${escapeAttr(event.Title || 'this course/event')}"
            >
                <i class="fa-solid fa-graduation-cap"></i> Register Now <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;
    }

    // Direct button on every card to view full flyer clearly
    actionButtonsHtml += `
        <button
            type="button"
            class="event-view-poster-btn"
            data-poster-src="${escapeAttr(posterUrl)}"
            data-poster-title="${escapeAttr(event.Title || 'Event Poster')}"
            data-poster-type="${escapeAttr(typeLabel)}"
            title="Inspect poster at high resolution"
        >
            <i class="fa-solid fa-expand"></i> View Flyer Full Size
        </button>
    `;

    // Card Inner HTML
    card.innerHTML = `
        ${posterHtml}

        <div class="event-card-body">

            <div class="event-top">
                <span class="event-type">${escapeHtml(typeLabel)}</span>
                <span class="event-status ${statusClass}">
                    <i class="fa-solid ${isUpcoming ? 'fa-circle-dot' : 'fa-clock-rotate-left'}"></i>
                    ${escapeHtml(statusLabel)}
                </span>
            </div>

            <h2 class="event-title">${escapeHtml(event.Title || "Untitled Event")}</h2>

            <div class="event-info">
                <p>
                    <i class="fa-regular fa-calendar"></i>
                    <span>${escapeHtml(event.Date || "Date to be announced")}</span>
                </p>
                ${event.Time ? `
                <p>
                    <i class="fa-regular fa-clock"></i>
                    <span>${escapeHtml(event.Time)}</span>
                </p>` : ""}
                <p>
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(event.Location || "SAIDE, IIT Jodhpur")}</span>
                </p>
            </div>

            <p class="event-description">${escapeHtml(event.Description || "")}</p>

            <div class="event-actions-bar">${actionButtonsHtml}</div>

        </div>
    `;

    // Hook click on poster wrapper
    const posterWrap = card.querySelector(".event-poster-wrapper");
    if (posterWrap) {
        posterWrap.addEventListener("click", function () {
            openPosterModal(posterUrl, event.Title, typeLabel, event.Date);
        });
    }

    // Hook click on "View Flyer Full Size" button
    const flyerBtn = card.querySelector(".event-view-poster-btn");
    if (flyerBtn) {
        flyerBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            openPosterModal(posterUrl, event.Title, typeLabel, event.Date);
        });
    }

    return card;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// INTERACTIVE CONTROLS (TABS, SEARCH, CATEGORY PILLS)
// ============================================================

function setupInteractiveControls() {
    // 1. Status Section Tabs
    const statusTabBtns = document.querySelectorAll(".status-tab-btn");
    statusTabBtns.forEach(function (btn) {
        btn.onclick = function () {
            statusTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeSectionTab = btn.getAttribute("data-tab") || "all";
            renderOrganizedEvents();
        };
    });

    // 2. Category Pills
    const catPillBtns = document.querySelectorAll(".cat-pill-btn");
    catPillBtns.forEach(function (btn) {
        btn.onclick = function () {
            catPillBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategoryFilter = (btn.getAttribute("data-cat") || "all").toLowerCase();
            renderOrganizedEvents();
        };
    });

    // 3. Search Bar
    const searchInput = document.getElementById("eventSearchInput");
    const clearBtn = document.getElementById("clearSearchBtn");

    if (searchInput) {
        searchInput.oninput = function () {
            currentSearchQuery = searchInput.value.trim().toLowerCase();
            if (clearBtn) {
                clearBtn.style.display = currentSearchQuery ? "block" : "none";
            }
            renderOrganizedEvents();
        };
    }

    if (clearBtn && searchInput) {
        clearBtn.onclick = function () {
            searchInput.value = "";
            currentSearchQuery = "";
            clearBtn.style.display = "none";
            renderOrganizedEvents();
        };
    }
}

// ============================================================
// POSTER LIGHTBOX MODAL (WITH ZOOM & FULL RES NEW TAB)
// ============================================================

let isModalZoomed = false;

function setupPosterLightboxModal() {
    const modal = document.getElementById("eventPosterModal");
    const closeBtn = document.getElementById("closeEventModalBtn");
    const modalImg = document.getElementById("modalPosterImg");
    const zoomBtn = document.getElementById("modalZoomBtn");

    if (closeBtn && modal) {
        closeBtn.onclick = function () {
            closePosterModal();
        };
    }

    if (modal) {
        modal.onclick = function (e) {
            // Close when clicking backdrop outside inner modal
            if (e.target === modal) {
                closePosterModal();
            }
        };
    }

    // Toggle 100% Zoom when clicking the image
    if (modalImg) {
        modalImg.onclick = function () {
            toggleModalZoom();
        };
    }

    // Toggle Zoom button
    if (zoomBtn) {
        zoomBtn.onclick = function () {
            toggleModalZoom();
        };
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closePosterModal();
        }
    });
}

function toggleModalZoom() {
    const modalImg = document.getElementById("modalPosterImg");
    const zoomText = document.getElementById("modalZoomBtnText");

    if (!modalImg) return;

    isModalZoomed = !isModalZoomed;

    if (isModalZoomed) {
        modalImg.classList.add("zoomed");
        if (zoomText) zoomText.textContent = "Fit to Screen";
    } else {
        modalImg.classList.remove("zoomed");
        if (zoomText) zoomText.textContent = "Zoom 100%";
    }
}

function openPosterModal(src, title, typeLabel, date) {
    const modal = document.getElementById("eventPosterModal");
    const modalImg = document.getElementById("modalPosterImg");
    const modalTitle = document.getElementById("modalEventTitle");
    const modalSubtitle = document.getElementById("modalEventSubtitle");
    const modalTypeBadge = document.getElementById("modalEventTypeBadge");
    const newTabBtn = document.getElementById("modalNewTabBtn");
    const downloadBtn = document.getElementById("modalDownloadBtn");
    const zoomText = document.getElementById("modalZoomBtnText");

    if (!modal || !modalImg) return;

    // Reset zoom state
    isModalZoomed = false;
    modalImg.classList.remove("zoomed");
    if (zoomText) zoomText.textContent = "Zoom 100%";

    modalImg.onerror = function () {
        this.onerror = null;
        this.src = "iitj_campus_hd.jpg";
    };

    modalImg.src = src;

    if (modalTitle) modalTitle.textContent = title || "Event Poster Flyer";
    if (modalTypeBadge) modalTypeBadge.textContent = typeLabel || "Event Poster";
    if (modalSubtitle) modalSubtitle.textContent = date ? `Scheduled: ${date} • Click picture to toggle 100% full scale` : "Click picture to toggle 100% full scale";

    // Direct link to view full resolution image in separate browser tab
    if (newTabBtn) {
        newTabBtn.href = src;
    }

    // Direct download link
    if (downloadBtn) {
        downloadBtn.href = src;
        const filename = (title || "event_poster").toLowerCase().replace(/[^a-z0-9]/g, "_") + ".jpg";
        downloadBtn.setAttribute("download", filename);
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closePosterModal() {
    const modal = document.getElementById("eventPosterModal");
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";

    const modalImg = document.getElementById("modalPosterImg");
    if (modalImg) modalImg.classList.remove("zoomed");
}

// ============================================================
// EVENT & COURSE REGISTRATION CONTROLLER
// ============================================================

function setupEventRegistrationModal() {
    const modal = document.getElementById("eventRegistrationModal");
    const form = document.getElementById("eventRegistrationForm");
    const formView = document.getElementById("regFormView");
    const successView = document.getElementById("regSuccessView");
    const closeBtn = document.getElementById("closeRegModalBtn");
    const cancelBtn = document.getElementById("cancelRegBtn");
    const doneBtn = document.getElementById("doneRegBtn");

    if (!modal) return;

    // Attach click listener to all Register Now buttons on event cards
    const registerButtons = document.querySelectorAll(".event-register-btn");
    registerButtons.forEach(function (btn) {
        if (btn.dataset.regAttached === "true") return;
        btn.dataset.regAttached = "true";

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const eventId = btn.getAttribute("data-event-id") || "";
            const eventTitle = btn.getAttribute("data-event-title") || "Lab Course / Event";
            const eventType = btn.getAttribute("data-event-type") || "Course";
            const eventDate = btn.getAttribute("data-event-date") || "Upcoming Schedule";
            const eventLocation = btn.getAttribute("data-event-location") || "IIT Jodhpur Permanent Campus";
            const customLink = btn.getAttribute("data-custom-link") || "";

            // If a specific, valid non-generic Google Form URL was configured with /d/e/, open that directly
            if (customLink && customLink.includes("docs.google.com/forms/d/e/")) {
                window.open(customLink, "_blank", "noopener,noreferrer");
                return;
            }

            openRegistrationModal({
                id: eventId,
                title: eventTitle,
                type: eventType,
                date: eventDate,
                location: eventLocation
            });
        });
    });

    // Close Modal Listeners
    if (closeBtn) closeBtn.onclick = closeRegistrationModal;
    if (cancelBtn) cancelBtn.onclick = closeRegistrationModal;
    if (doneBtn) doneBtn.onclick = closeRegistrationModal;

    modal.onclick = function (e) {
        if (e.target === modal) {
            closeRegistrationModal();
        }
    };

    if (!document.body.dataset.regKeyAttached) {
        document.body.dataset.regKeyAttached = "true";
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && modal.style.display !== "none") {
                closeRegistrationModal();
            }
        });
    }

    // Handle Form Submission
    if (form && !form.dataset.listenerAttached) {
        form.dataset.listenerAttached = "true";
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const fullName = (document.getElementById("regFullName")?.value || "").trim();
            const rollNumber = (document.getElementById("regRollNumber")?.value || "").trim();
            const email = (document.getElementById("regEmail")?.value || "").trim();
            const qualification = (document.getElementById("regQualification")?.value || "").trim();
            const institution = (document.getElementById("regInstitution")?.value || "").trim();
            const phone = (document.getElementById("regPhone")?.value || "").trim();
            const eventTitle = (document.getElementById("regFormEventTitle")?.value || "").trim();
            const eventId = (document.getElementById("regEventId")?.value || "").trim();

            if (!fullName || !rollNumber || !email || !qualification) {
                alert("Please fill in all required fields: Full Name, Student Roll Number, Gmail, and Educational Qualifications.");
                return;
            }

            const timestamp = new Date().toISOString();
            const dateFormatted = new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            const registrationRecord = {
                id: "reg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                eventId: eventId,
                eventTitle: eventTitle,
                fullName: fullName,
                rollNumber: rollNumber,
                email: email,
                qualification: qualification,
                institution: institution || "IIT Jodhpur / Affiliated",
                phone: phone || "Not Provided",
                timestamp: timestamp,
                dateFormatted: dateFormatted,
                targetAdmin: ADMIN_NOTIFICATION_EMAIL
            };

            // 1. Save to local storage for instant dashboard viewing, backup & persistence
            try {
                const existing = JSON.parse(localStorage.getItem(REGISTRATIONS_STORAGE_KEY) || "[]");
                existing.unshift(registrationRecord);
                localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(existing));
            } catch (err) {
                console.warn("Storage save error:", err);
            }

            // 2. Dispatch background request to Google Apps Script / Webhook
            try {
                fetch(EVENTS_API, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "event_registration",
                        ...registrationRecord
                    })
                }).catch(() => {});
            } catch (err) {}

            // 3. Prepare formatted mailto link addressed to nextgenlab1234@gmail.com
            const emailSubject = encodeURIComponent(`[BIRD Lab Event Registration] ${eventTitle} - ${fullName} (${rollNumber})`);
            const emailBody = encodeURIComponent(
`BIRD LAB COURSE & EVENT REGISTRATION RECEIPT
=====================================================
Course / Event: ${eventTitle}
Participant Full Name: ${fullName}
Student Roll Number / College ID: ${rollNumber}
Gmail / Email: ${email}
Educational Qualifications: ${qualification}
Institution / College: ${institution || 'Not Provided'}
Contact Phone / WhatsApp: ${phone || 'Not Provided'}
Submitted At: ${dateFormatted}
Routing Recipient: ${ADMIN_NOTIFICATION_EMAIL}

Connected Google Sheet:
${CONNECTED_SHEET_URL}
=====================================================`
            );
            const mailtoUrl = `mailto:${ADMIN_NOTIFICATION_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

            // 4. Populate Success Receipt View
            const receiptTitle = document.getElementById("receiptEventTitle");
            const receiptName = document.getElementById("receiptName");
            const receiptRoll = document.getElementById("receiptRoll");
            const receiptEmail = document.getElementById("receiptEmail");
            const receiptQual = document.getElementById("receiptQual");
            const mailtoBtn = document.getElementById("receiptMailtoBtn");
            const sheetBtn = document.getElementById("receiptSheetBtn");

            if (receiptTitle) receiptTitle.textContent = eventTitle;
            if (receiptName) receiptName.textContent = fullName;
            if (receiptRoll) receiptRoll.textContent = rollNumber;
            if (receiptEmail) receiptEmail.textContent = email;
            if (receiptQual) receiptQual.textContent = qualification;
            if (mailtoBtn) mailtoBtn.href = mailtoUrl;
            if (sheetBtn) sheetBtn.href = CONNECTED_SHEET_URL;

            // Switch from Form to Success view
            if (formView) formView.style.display = "none";
            if (successView) successView.style.display = "block";
        });
    }
}

function openRegistrationModal(eventInfo) {
    const modal = document.getElementById("eventRegistrationModal");
    const formView = document.getElementById("regFormView");
    const successView = document.getElementById("regSuccessView");
    const form = document.getElementById("eventRegistrationForm");

    const badge = document.getElementById("regCourseTypeBadge");
    const title = document.getElementById("regCourseTitle");
    const date = document.getElementById("regCourseDate");
    const loc = document.getElementById("regCourseLocation");
    const hiddenTitle = document.getElementById("regFormEventTitle");
    const hiddenId = document.getElementById("regEventId");

    if (!modal) return;

    if (badge) badge.textContent = eventInfo.type || "Course";
    if (title) title.textContent = eventInfo.title || "Lab Course / Event";
    if (date) date.textContent = eventInfo.date || "Scheduled Program";
    if (loc) loc.textContent = eventInfo.location || "IIT Jodhpur";
    if (hiddenTitle) hiddenTitle.value = eventInfo.title || "";
    if (hiddenId) hiddenId.value = eventInfo.id || "";

    // Reset inputs
    if (form) form.reset();
    if (hiddenTitle) hiddenTitle.value = eventInfo.title || "";
    if (hiddenId) hiddenId.value = eventInfo.id || "";

    // Show form view, hide success view
    if (formView) formView.style.display = "block";
    if (successView) successView.style.display = "none";

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeRegistrationModal() {
    const modal = document.getElementById("eventRegistrationModal");
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    loadEvents();

    // Ensure sheet access button points to the connected responses Google Sheet
    const sheetBtn = document.querySelector(".sheet-access-btn");
    if (sheetBtn) {
        sheetBtn.href = CONNECTED_SHEET_URL;
    }
});