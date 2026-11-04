import { auth } from "./firebase2.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// =====================================================
// SECURITY AUTH GUARD
// =====================================================

const sessionEmail = sessionStorage.getItem("birdlab_events_admin_auth");
if (!sessionEmail) {
    window.location.replace("admin-events.html");
}

// =====================================================
// CONSTANTS & KEYS
// =====================================================

const EVENTS_STORAGE_KEY = "birdlab_custom_events";
const REGISTRATIONS_STORAGE_KEY = "birdlab_event_registrations";
const CONNECTED_SHEET_URL = "https://docs.google.com/spreadsheets/d/1CSlzKRnWN2CtiKCHTJUowHMF13_MdQBHNAUml7ouAvI/edit?gid=0#gid=0";
const ADMIN_NOTIFICATION_EMAIL = "nextgenlab1234@gmail.com";
const EVENTS_API =
    "https://script.google.com/macros/s/AKfycbxbe2jNcLtEtUN3myTvIgZE_R_cscvcaWNXezXAIKY3hQgz2Ko3fpJGGf3FLGiDyXdA/exec";

// Distinct gallery images to prevent any repeated pictures
const UNIQUE_LAB_GALLERY = [
    { key: "iitj_campus", src: "iitj_campus_hd.jpg", title: "IIT Jodhpur Permanent Campus" },
    { key: "rehab_treadmill", src: "wheelchair-treadmill.png", title: "Rehabilitation Gait Platform" },
    { key: "autonomous_rover", src: "c2.jpeg", title: "Autonomous Mobile Robotics" },
    { key: "bio_flight", src: "bio-inspired.jpg", title: "Bio-Inspired Flapping Robot" },
    { key: "exoskeleton", src: "wearable-robotics.jpg", title: "Wearable Bionic Exoskeleton" },
    { key: "ai_manipulator", src: "applied-ai-robotics.jpg", title: "Vision-Guided AI Robot Arm" },
    { key: "teleoperation", src: "tele-robotics.jpg", title: "Haptic Bilateral Tele-Robotics" },
    { key: "wing_aero", src: "research1.jpg", title: "Flapping Wing Aerodynamics" },
    { key: "pratham_platform", src: "pratham3.0.png", title: "Pratham 3.0 Autonomous Rover" },
    { key: "micro_fabrication", src: "phrozen-mega-8k.png", title: "8K Additive Prototyping" },
    { key: "sensor_rig", src: "research2.jpg", title: "Neuromorphic Sensor Rig" }
];

// =====================================================
// IMAGE RESOLVER & DEDUPLICATION ENGINE
// =====================================================

function resolveEventPoster(event, fallbackIndex = 0) {
    if (!event) return UNIQUE_LAB_GALLERY[fallbackIndex % UNIQUE_LAB_GALLERY.length].src;

    let poster = String(event.Poster || event["Poster Link"] || "").trim();

    // 1. Google Drive Share URL -> Direct Image Embed Conversion
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

    // 3. If explicit custom image or base64 data URL provided and valid, keep it
    if (poster !== "" && !poster.includes("undefined") && !poster.includes("null")) {
        return poster;
    }

    // 4. Content-aware assignment of DISTINCT images per event
    const title = String(event.Title || "").toLowerCase();
    const type = String(event.Type || "").toLowerCase();

    if (title.includes("international robotics conference") || (title.includes("conference") && title.includes("international"))) {
        return "iitj_campus_hd.jpg";
    }
    if (title.includes("workshop on wearable") || title.includes("wearable robotics & exoskeletons")) {
        return "wheelchair-treadmill.png";
    }
    if (title.includes("chen") || title.includes("sarah") || title.includes("future of bio-inspired")) {
        return "c2.jpeg";
    }
    if (title.includes("winter school") || title.includes("neuromorphic")) {
        return "bio-inspired.jpg";
    }
    if (title.includes("symposium on wearable") || title.includes("assistive robotics")) {
        return "wearable-robotics.jpg";
    }
    if (title.includes("applied ai") || title.includes("manipulation")) {
        return "applied-ai-robotics.jpg";
    }
    if (title.includes("tele-robotics") || title.includes("teleoperation") || title.includes("haptic")) {
        return "tele-robotics.jpg";
    }
    if (title.includes("bird flight") || title.includes("mechanics of bird")) {
        return "research1.jpg";
    }
    if (title.includes("pratham") || title.includes("ground robot")) {
        return "pratham3.0.png";
    }
    if (title.includes("additive") || title.includes("fabrication") || title.includes("prototyping")) {
        return "phrozen-mega-8k.png";
    }

    return UNIQUE_LAB_GALLERY[fallbackIndex % UNIQUE_LAB_GALLERY.length].src;
}

// 10 Curated Laboratory Events with 10 Completely Unique Posters
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

// =====================================================
// DOM ELEMENTS
// =====================================================

const userEmailBadge = document.getElementById("userEmailBadge");
const logoutBtn = document.getElementById("logoutBtn");

// Stats Elements
const statTotalEvents = document.getElementById("statTotalEvents");
const statUpcomingEvents = document.getElementById("statUpcomingEvents");
const statPastEvents = document.getElementById("statPastEvents");
const statPostersCount = document.getElementById("statPostersCount");

// Filter & Search
const searchInput = document.getElementById("searchInput");
const filterTabBtns = document.querySelectorAll(".filter-tab-btn");
const countAll = document.getElementById("countAll");
const countUpcoming = document.getElementById("countUpcoming");
const countPast = document.getElementById("countPast");
const adminEventsList = document.getElementById("adminEventsList");

// Form Elements
const eventForm = document.getElementById("eventForm");
const formTitle = document.getElementById("formTitle");
const editModeBadge = document.getElementById("editModeBadge");
const eventIdInput = document.getElementById("eventId");
const eventTitleInput = document.getElementById("eventTitle");
const eventTypeInput = document.getElementById("eventType");
const statusUpcomingRadio = document.getElementById("statusUpcoming");
const statusPastRadio = document.getElementById("statusPast");
const optUpcomingLabel = document.getElementById("optUpcomingLabel");
const optPastLabel = document.getElementById("optPastLabel");
const eventDateInput = document.getElementById("eventDate");
const eventTimeInput = document.getElementById("eventTime");
const eventLocationInput = document.getElementById("eventLocation");
const eventRegLinkInput = document.getElementById("eventRegLink");
const eventDescriptionInput = document.getElementById("eventDescription");
const saveEventBtn = document.getElementById("saveEventBtn");
const saveBtnText = document.getElementById("saveBtnText");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearFormBtn = document.getElementById("clearFormBtn");

// Poster Upload Elements
const posterDropzone = document.getElementById("posterDropzone");
const posterFileInput = document.getElementById("posterFileInput");
const posterPreviewContainer = document.getElementById("posterPreviewContainer");
const posterPreviewImg = document.getElementById("posterPreviewImg");
const posterFileName = document.getElementById("posterFileName");
const posterFileSize = document.getElementById("posterFileSize");
const btnRemovePoster = document.getElementById("btnRemovePoster");
const posterUrlInput = document.getElementById("posterUrlInput");

// Utilities
const btnRestoreDefaults = document.getElementById("btnRestoreDefaults");
const btnSyncGoogleSheet = document.getElementById("btnSyncGoogleSheet");
const btnExportJson = document.getElementById("btnExportJson");
const importJsonInput = document.getElementById("importJsonInput");

// Lightbox Modal
const lightboxModal = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const adminLightboxNewTab = document.getElementById("adminLightboxNewTab");
const closeLightboxBtn = document.getElementById("closeLightboxBtn");

// Toast
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

// State
let stagedPosterDataUrl = "";
let currentFilter = "all";
let toastTimeout = null;

// Initialize User Email
if (userEmailBadge && sessionEmail) {
    userEmailBadge.textContent = sessionEmail;
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = "success") {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.className = type;
    toast.style.display = "flex";

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.display = "none";
    }, 3500);
}

// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (e) {}
        sessionStorage.removeItem("birdlab_events_admin_auth");
        window.location.replace("admin-events.html");
    });
}

// =====================================================
// LOCAL STORAGE HELPERS WITH AUTO-DEDUPLICATION
// =====================================================

function getStoredEvents() {
    try {
        const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Deduplicate any repeated pictures
                const usedPosters = new Set();
                let modified = false;

                parsed.forEach((evt, idx) => {
                    let resolved = resolveEventPoster(evt, idx);
                    if (usedPosters.has(resolved)) {
                        const unused = UNIQUE_LAB_GALLERY.find(g => !usedPosters.has(g.src));
                        if (unused) resolved = unused.src;
                    }

                    if (evt.Poster !== resolved) {
                        evt.Poster = resolved;
                        modified = true;
                    }
                    usedPosters.add(resolved);

                    // Sanitize any generic Google Forms links from previous sessions
                    const rawLink = String(evt["Registration Link"] || "").trim();
                    if (
                        rawLink === "https://docs.google.com/forms" ||
                        rawLink === "https://docs.google.com/forms/" ||
                        rawLink === "https://docs.google.com/forms/u/0" ||
                        rawLink === "https://docs.google.com/forms/u/0/"
                    ) {
                        evt["Registration Link"] = "";
                        modified = true;
                    }
                });

                if (modified) {
                    saveStoredEvents(parsed);
                }
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Notice: Error parsing stored events:", e);
    }

    // Return default events if none stored yet
    saveStoredEvents(DEFAULT_LAB_EVENTS);
    return DEFAULT_LAB_EVENTS;
}

function saveStoredEvents(events) {
    try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
        console.error("Storage Error:", e);
        showToast("Storage quota warning. Consider using smaller poster images.", "warning");
    }
}

// =====================================================
// IMAGE COMPRESSION & OPTIMIZATION
// =====================================================

function optimizeImage(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Unable to parse image"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(file);
    });
}

// =====================================================
// POSTER UPLOAD & PRESET CONTROLLER
// =====================================================

function setStagedPoster(src, name = "Custom Event Poster", info = "Image attached") {
    stagedPosterDataUrl = src;
    if (posterPreviewImg) {
        posterPreviewImg.onerror = function() {
            this.onerror = null;
            this.src = "iitj_campus_hd.jpg";
        };
        posterPreviewImg.src = src;
    }
    if (posterFileName) posterFileName.textContent = name;
    if (posterFileSize) posterFileSize.textContent = info;
    if (posterPreviewContainer) posterPreviewContainer.style.display = "flex";
}

function clearStagedPoster() {
    stagedPosterDataUrl = "";
    if (posterFileInput) posterFileInput.value = "";
    if (posterUrlInput) posterUrlInput.value = "";
    if (posterPreviewContainer) posterPreviewContainer.style.display = "none";
}

if (posterDropzone) {
    posterDropzone.addEventListener("click", (e) => {
        if (e.target.closest("#btnRemovePoster") || e.target.closest("#posterPreviewImg")) return;
        posterFileInput.click();
    });

    posterDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        posterDropzone.classList.add("dragover");
    });

    posterDropzone.addEventListener("dragleave", () => {
        posterDropzone.classList.remove("dragover");
    });

    posterDropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        posterDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handlePosterFile(e.dataTransfer.files[0]);
        }
    });
}

if (posterFileInput) {
    posterFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
            await handlePosterFile(e.target.files[0]);
        }
    });
}

async function handlePosterFile(file) {
    if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file (PNG, JPG, WEBP).", "error");
        return;
    }

    try {
        const compressedDataUrl = await optimizeImage(file);
        const sizeKb = Math.round((compressedDataUrl.length * 3 / 4) / 1024);
        setStagedPoster(compressedDataUrl, file.name, `Optimized (~${sizeKb} KB)`);
        showToast("Event poster flyer loaded successfully!");
    } catch (err) {
        console.error(err);
        showToast("Could not process this image file.", "error");
    }
}

if (btnRemovePoster) {
    btnRemovePoster.addEventListener("click", (e) => {
        e.stopPropagation();
        clearStagedPoster();
        showToast("Event poster removed.", "warning");
    });
}

if (posterUrlInput) {
    posterUrlInput.addEventListener("change", () => {
        const url = posterUrlInput.value.trim();
        if (url) {
            const resolved = resolveEventPoster({ Poster: url });
            setStagedPoster(resolved, "External Poster Link", "Linked URL");
            showToast("External poster link attached.");
        }
    });
}

// Preset gallery buttons
const presetBtns = document.querySelectorAll(".btn-preset-poster");
presetBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const src = btn.getAttribute("data-src");
        if (src) {
            setStagedPoster(src, btn.textContent + " Poster", "Lab Gallery");
            showToast(`Selected "${btn.textContent}" poster from lab gallery!`);
        }
    });
});

// Click thumbnail to zoom in lightbox
if (posterPreviewImg) {
    posterPreviewImg.addEventListener("click", () => {
        if (stagedPosterDataUrl) {
            openLightbox(stagedPosterDataUrl, "Poster Preview");
        }
    });
}

// =====================================================
// STATUS RADIO TOGGLE
// =====================================================

function updateStatusRadioUI() {
    if (statusUpcomingRadio.checked) {
        optUpcomingLabel.classList.add("active");
        optPastLabel.classList.remove("active");
    } else {
        optPastLabel.classList.add("active");
        optUpcomingLabel.classList.remove("active");
    }
}

if (statusUpcomingRadio && statusPastRadio) {
    statusUpcomingRadio.addEventListener("change", updateStatusRadioUI);
    statusPastRadio.addEventListener("change", updateStatusRadioUI);
    optUpcomingLabel.addEventListener("click", () => {
        statusUpcomingRadio.checked = true;
        updateStatusRadioUI();
    });
    optPastLabel.addEventListener("click", () => {
        statusPastRadio.checked = true;
        updateStatusRadioUI();
    });
}

// =====================================================
// RENDER EVENTS & DASHBOARD STATE
// =====================================================

function refreshDashboard() {
    const events = getStoredEvents();

    // Update Statistics
    const total = events.length;
    const upcoming = events.filter(e => String(e.Status || "").toLowerCase() === "upcoming").length;
    const past = events.filter(e => String(e.Status || "").toLowerCase() === "past").length;
    const withPosters = events.filter(e => Boolean(e.Poster && e.Poster.trim())).length;

    if (statTotalEvents) statTotalEvents.textContent = total;
    if (statUpcomingEvents) statUpcomingEvents.textContent = upcoming;
    if (statPastEvents) statPastEvents.textContent = past;
    if (statPostersCount) statPostersCount.textContent = withPosters;

    if (countAll) countAll.textContent = total;
    if (countUpcoming) countUpcoming.textContent = upcoming;
    if (countPast) countPast.textContent = past;

    // Filter events
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const filtered = events.filter(event => {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "upcoming" && String(event.Status || "").toLowerCase() === "upcoming") ||
            (currentFilter === "past" && String(event.Status || "").toLowerCase() === "past");

        if (!matchesFilter) return false;

        if (!query) return true;

        const title = String(event.Title || "").toLowerCase();
        const type = String(event.Type || "").toLowerCase();
        const loc = String(event.Location || "").toLowerCase();
        const desc = String(event.Description || "").toLowerCase();
        const date = String(event.Date || "").toLowerCase();

        return title.includes(query) || type.includes(query) || loc.includes(query) || desc.includes(query) || date.includes(query);
    });

    renderAdminEventsList(filtered);
    renderRegistrationsSection();
}

function renderAdminEventsList(events) {
    if (!adminEventsList) return;
    adminEventsList.innerHTML = "";

    if (events.length === 0) {
        adminEventsList.innerHTML = `
            <div style="text-align: center; padding: 48px 20px; color: #64748b; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px;">
                <i class="fa-regular fa-calendar-xmark" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                <h4 style="font-size: 16px; color: #1e293b; margin-bottom: 4px;">No events found</h4>
                <p style="font-size: 13px;">No events match the current filter or search criteria.</p>
            </div>
        `;
        return;
    }

    events.forEach((event, idx) => {
        const isUpcoming = String(event.Status || "").toLowerCase() === "upcoming";
        const posterUrl = resolveEventPoster(event, idx);

        const card = document.createElement("div");
        card.className = `event-item-card ${isUpcoming ? "is-upcoming" : "is-past"}`;

        const posterHtml = `
            <div class="event-poster-thumb-box" title="Click to preview poster at full size">
                <img
                    src="${escapeHtml(posterUrl)}"
                    alt="Poster"
                    onerror="this.onerror=null; this.src='iitj_campus_hd.jpg';"
                >
                <span class="poster-zoom-pill"><i class="fa-solid fa-expand"></i></span>
            </div>
        `;

        card.innerHTML = `
            ${posterHtml}
            <div class="event-item-content">
                <div class="event-badge-row">
                    <span class="type-pill">${escapeHtml(event.Type || "Event")}</span>
                    <span class="status-pill ${isUpcoming ? "upcoming" : "past"}">
                        <i class="fa-solid ${isUpcoming ? "fa-circle-dot" : "fa-clock-rotate-left"}"></i>
                        ${isUpcoming ? "Upcoming Section" : "Past Section"}
                    </span>
                </div>
                <h3 class="event-item-title">${escapeHtml(event.Title || "Untitled Event")}</h3>
                <div class="event-meta-row">
                    <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(event.Date || "TBA")}</span>
                    ${event.Time ? `<span><i class="fa-regular fa-clock"></i> ${escapeHtml(event.Time)}</span>` : ""}
                    <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.Location || "SAIDE, IIT Jodhpur")}</span>
                    ${event["Registration Link"] ? `<span><a href="${escapeHtml(event["Registration Link"])}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight:600;"><i class="fa-solid fa-link"></i> Link</a></span>` : ""}
                </div>
                <p class="event-item-desc">${escapeHtml(event.Description || "No description provided.")}</p>

                <div class="event-card-actions">
                    <button class="btn-act btn-toggle-status ${isUpcoming ? "mark-past" : ""}" data-action="toggle-status" data-id="${event.id}">
                        <i class="fa-solid ${isUpcoming ? "fa-box-archive" : "fa-clock"}"></i>
                        ${isUpcoming ? "Move to Past" : "Move to Upcoming"}
                    </button>
                    <button class="btn-act btn-edit" data-action="edit" data-id="${event.id}">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn-act btn-delete" data-action="delete" data-id="${event.id}">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            </div>
        `;

        // Poster thumbnail click listener
        const thumbBox = card.querySelector(".event-poster-thumb-box");
        if (thumbBox) {
            thumbBox.addEventListener("click", () => {
                openLightbox(posterUrl, event.Title);
            });
        }

        // Action buttons
        const toggleBtn = card.querySelector('[data-action="toggle-status"]');
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => handleToggleStatus(event.id));
        }

        const editBtn = card.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.addEventListener("click", () => handleStartEdit(event.id));
        }

        const deleteBtn = card.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => handleDeleteEvent(event.id));
        }

        adminEventsList.appendChild(card);
    });
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

// =====================================================
// STATUS TOGGLE & DELETE HANDLERS
// =====================================================

function handleToggleStatus(eventId) {
    const events = getStoredEvents();
    const target = events.find(e => String(e.id) === String(eventId));
    if (!target) return;

    const currentStatus = String(target.Status || "").toLowerCase();
    const newStatus = currentStatus === "upcoming" ? "Past" : "Upcoming";
    target.Status = newStatus;

    saveStoredEvents(events);
    refreshDashboard();
    showToast(`Event organized into "${newStatus} Events" section!`);
}

function handleDeleteEvent(eventId) {
    const events = getStoredEvents();
    const target = events.find(e => String(e.id) === String(eventId));
    if (!target) return;

    if (!confirm(`Are you sure you want to delete "${target.Title}"?`)) {
        return;
    }

    const updated = events.filter(e => String(e.id) !== String(eventId));
    saveStoredEvents(updated);

    // If currently editing this event, reset the form
    if (eventIdInput.value === String(eventId)) {
        resetForm();
    }

    refreshDashboard();
    showToast(`Event deleted successfully.`, "warning");
}

// =====================================================
// EDIT EVENT HANDLER
// =====================================================

function handleStartEdit(eventId) {
    const events = getStoredEvents();
    const event = events.find(e => String(e.id) === String(eventId));
    if (!event) return;

    // Fill form
    eventIdInput.value = event.id;
    eventTitleInput.value = event.Title || "";
    eventTypeInput.value = event.Type || "Workshop";

    const isUpcoming = String(event.Status || "").toLowerCase() === "upcoming";
    statusUpcomingRadio.checked = isUpcoming;
    statusPastRadio.checked = !isUpcoming;
    updateStatusRadioUI();

    eventDateInput.value = event.Date || "";
    eventTimeInput.value = event.Time || "";
    eventLocationInput.value = event.Location || "";
    eventRegLinkInput.value = event["Registration Link"] || "";
    eventDescriptionInput.value = event.Description || "";

    // Poster
    const posterSrc = resolveEventPoster(event);
    setStagedPoster(posterSrc, "Attached Poster Flyer", "Saved with event");

    // UI state
    formTitle.textContent = "Edit Event Details";
    editModeBadge.style.display = "inline-block";
    saveBtnText.textContent = "Update Event";
    cancelEditBtn.style.display = "inline-block";

    // Smooth scroll to form
    const editorCard = document.getElementById("editorCard");
    if (editorCard) {
        editorCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function resetForm() {
    eventForm.reset();
    eventIdInput.value = "";
    statusUpcomingRadio.checked = true;
    updateStatusRadioUI();
    clearStagedPoster();

    formTitle.textContent = "Add New Event";
    editModeBadge.style.display = "none";
    saveBtnText.textContent = "Add Event";
    cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
}

if (clearFormBtn) {
    clearFormBtn.addEventListener("click", resetForm);
}

// =====================================================
// SAVE / UPDATE FORM SUBMISSION
// =====================================================

eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = eventTitleInput.value.trim();
    const type = eventTypeInput.value;
    const status = statusUpcomingRadio.checked ? "Upcoming" : "Past";
    const date = eventDateInput.value.trim();
    const time = eventTimeInput.value.trim();
    const location = eventLocationInput.value.trim();
    const regLink = eventRegLinkInput.value.trim();
    const description = eventDescriptionInput.value.trim();
    let poster = stagedPosterDataUrl || posterUrlInput.value.trim();

    if (!title || !date || !location || !description) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    // Auto-assign poster if none provided
    if (!poster) {
        poster = resolveEventPoster({ Title: title, Type: type });
    }

    const events = getStoredEvents();
    const editingId = eventIdInput.value;

    if (editingId) {
        // Update existing
        const index = events.findIndex(evt => String(evt.id) === String(editingId));
        if (index !== -1) {
            events[index] = {
                ...events[index],
                Title: title,
                Type: type,
                Status: status,
                Date: date,
                Time: time,
                Location: location,
                "Registration Link": regLink,
                Description: description,
                Poster: poster
            };
            showToast(`Event "${title}" updated successfully!`);
        }
    } else {
        // Create new
        const newEvent = {
            id: "evt_" + Date.now(),
            Title: title,
            Type: type,
            Status: status,
            Date: date,
            Time: time,
            Location: location,
            "Registration Link": regLink,
            Description: description,
            Poster: poster
        };
        events.unshift(newEvent);
        showToast(`Event "${title}" added to ${status} events section!`);
    }

    saveStoredEvents(events);
    resetForm();
    refreshDashboard();
});

// =====================================================
// SEARCH & FILTER TABS
// =====================================================

if (searchInput) {
    searchInput.addEventListener("input", refreshDashboard);
}

filterTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterTabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter") || "all";
        refreshDashboard();
    });
});

// =====================================================
// UTILITIES: RESTORE, SYNC, EXPORT, IMPORT
// =====================================================

if (btnRestoreDefaults) {
    btnRestoreDefaults.addEventListener("click", () => {
        if (confirm("Reset events list to 10 unique laboratory workshops and conferences? Any custom events will be replaced.")) {
            saveStoredEvents(DEFAULT_LAB_EVENTS);
            resetForm();
            refreshDashboard();
            showToast("Laboratory default events restored with unique posters.");
        }
    });
}

if (btnSyncGoogleSheet) {
    btnSyncGoogleSheet.addEventListener("click", async () => {
        try {
            btnSyncGoogleSheet.disabled = true;
            btnSyncGoogleSheet.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;

            const res = await fetch(EVENTS_API + "?t=" + Date.now());
            if (!res.ok) throw new Error("Google Sheet unreachable.");

            const data = await res.json();
            const sheetEvents = data.events || [];

            if (sheetEvents.length === 0) {
                showToast("Connected sheet has no events active.", "warning");
                return;
            }

            const current = getStoredEvents();
            let addedCount = 0;

            sheetEvents.forEach((sheetItem, sIdx) => {
                if (String(sheetItem.Status || "").toLowerCase() === "inactive") return;

                const exists = current.some(c =>
                    c.Title && sheetItem.Title &&
                    c.Title.trim().toLowerCase() === sheetItem.Title.trim().toLowerCase()
                );

                if (!exists) {
                    const sheetEvt = {
                        id: "evt_sheet_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
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
                    current.push(sheetEvt);
                    addedCount++;
                }
            });

            saveStoredEvents(current);
            refreshDashboard();
            showToast(`Synchronized! ${addedCount} new events imported from Google Sheet.`);
        } catch (err) {
            console.error("Sync Error:", err);
            showToast("Failed to fetch Google Sheet data. Please check network.", "error");
        } finally {
            btnSyncGoogleSheet.disabled = false;
            btnSyncGoogleSheet.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Sync from Google Sheet`;
        }
    });
}

if (btnExportJson) {
    btnExportJson.addEventListener("click", () => {
        const events = getStoredEvents();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `birdlab_events_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Events JSON backup downloaded.");
    });
}

if (importJsonInput) {
    importJsonInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed)) {
                    parsed.forEach((evt, idx) => {
                        evt.Poster = resolveEventPoster(evt, idx);
                    });
                    saveStoredEvents(parsed);
                    refreshDashboard();
                    showToast(`Imported ${parsed.length} events from backup.`);
                } else {
                    showToast("Invalid JSON structure. Array expected.", "error");
                }
            } catch (err) {
                showToast("Failed to parse JSON file.", "error");
            }
        };
        reader.readAsText(file);
    });
}

// =====================================================
// LIGHTBOX MODAL
// =====================================================

function openLightbox(src, caption = "") {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.onerror = function() {
        this.onerror = null;
        this.src = "iitj_campus_hd.jpg";
    };
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (adminLightboxNewTab) adminLightboxNewTab.href = src;
    lightboxModal.classList.add("active");
}

function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove("active");
    if (lightboxImg) lightboxImg.src = "";
}

if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener("click", closeLightbox);
}

if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
        if (e.target === lightboxModal) {
            closeLightbox();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("active")) {
        closeLightbox();
    }
});

// =====================================================
// COURSE REGISTRATIONS & GOOGLE FORM RESPONSES CONTROLLER
// =====================================================

const statTotalRegistrations = document.getElementById("statTotalRegistrations");
const registrationsTableBody = document.getElementById("registrationsTableBody");
const noRegistrationsMsg = document.getElementById("noRegistrationsMsg");
const regSearchInput = document.getElementById("regSearchInput");
const regEventFilter = document.getElementById("regEventFilter");
const btnExportRegistrationsCsv = document.getElementById("btnExportRegistrationsCsv");
const btnClearRegistrations = document.getElementById("btnClearRegistrations");
const regConnectedSheetBtn = document.getElementById("regConnectedSheetBtn");

function getStoredRegistrations() {
    try {
        const stored = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Notice: Error parsing stored registrations:", e);
    }
    return [];
}

function saveStoredRegistrations(registrations) {
    try {
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
    } catch (e) {
        console.error("Storage Error saving registrations:", e);
    }
}

function renderRegistrationsSection() {
    const registrations = getStoredRegistrations();
    const events = getStoredEvents();

    // 1. Update Stat Badge
    if (statTotalRegistrations) {
        statTotalRegistrations.textContent = registrations.length;
    }

    // 2. Ensure Sheet button points to connected responses Google Sheet
    if (regConnectedSheetBtn) {
        regConnectedSheetBtn.href = CONNECTED_SHEET_URL;
    }

    // 3. Populate Event Filter Dropdown
    if (regEventFilter) {
        const currentSelected = regEventFilter.value;
        const eventTitles = Array.from(new Set(events.map(e => e.Title).filter(Boolean)));

        let optionsHtml = `<option value="all">All Events / Courses (${registrations.length})</option>`;
        eventTitles.forEach(title => {
            const count = registrations.filter(r => r.eventTitle === title).length;
            optionsHtml += `<option value="${escapeHtml(title)}">${escapeHtml(title)} (${count})</option>`;
        });
        regEventFilter.innerHTML = optionsHtml;
        if (currentSelected && (currentSelected === "all" || eventTitles.includes(currentSelected))) {
            regEventFilter.value = currentSelected;
        }
    }

    // 4. Filter Registrations
    const searchQuery = (regSearchInput ? regSearchInput.value : "").trim().toLowerCase();
    const filterEvent = regEventFilter ? regEventFilter.value : "all";

    const filtered = registrations.filter(reg => {
        if (filterEvent !== "all" && reg.eventTitle !== filterEvent) return false;
        if (!searchQuery) return true;

        const name = String(reg.fullName || "").toLowerCase();
        const roll = String(reg.rollNumber || "").toLowerCase();
        const email = String(reg.email || "").toLowerCase();
        const qual = String(reg.qualification || "").toLowerCase();
        const evTitle = String(reg.eventTitle || "").toLowerCase();
        const inst = String(reg.institution || "").toLowerCase();

        return (
            name.includes(searchQuery) ||
            roll.includes(searchQuery) ||
            email.includes(searchQuery) ||
            qual.includes(searchQuery) ||
            evTitle.includes(searchQuery) ||
            inst.includes(searchQuery)
        );
    });

    // 5. Render Table
    if (!registrationsTableBody) return;
    registrationsTableBody.innerHTML = "";

    if (filtered.length === 0) {
        if (noRegistrationsMsg) noRegistrationsMsg.style.display = "block";
        return;
    }

    if (noRegistrationsMsg) noRegistrationsMsg.style.display = "none";

    filtered.forEach((reg, index) => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.style.transition = "background-color 0.15s ease";

        const mailtoLink = `mailto:${reg.email}?subject=Regarding Your Registration: ${encodeURIComponent(reg.eventTitle)}&body=Dear ${encodeURIComponent(reg.fullName)},%0D%0A%0D%0AThank you for registering for ${encodeURIComponent(reg.eventTitle)} at BIRD Lab, IIT Jodhpur.%0D%0A%0D%0AStudent Roll No: ${encodeURIComponent(reg.rollNumber)}%0D%0A%0D%0ABest regards,%0D%0ABIRD Lab Administration`;

        tr.innerHTML = `
            <td style="padding: 10px 12px; color: #64748b; font-weight: 600;">${index + 1}</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">${escapeHtml(reg.fullName || "-")}</td>
            <td style="padding: 10px 12px;"><span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 600; color: #1e293b;">${escapeHtml(reg.rollNumber || "-")}</span></td>
            <td style="padding: 10px 12px;"><a href="mailto:${escapeHtml(reg.email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(reg.email || "-")}</a></td>
            <td style="padding: 10px 12px; color: #475569;">${escapeHtml(reg.qualification || "-")}</td>
            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b; max-width: 220px;">${escapeHtml(reg.eventTitle || "-")}</td>
            <td style="padding: 10px 12px; color: #64748b;">${escapeHtml(reg.institution || "-")}</td>
            <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${escapeHtml(reg.dateFormatted || "-")}</td>
            <td style="padding: 10px 12px; text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <a href="${mailtoLink}" class="btn-action edit" style="padding: 5px 8px; border-radius: 4px; text-decoration: none; color: #2563eb; background: #eff6ff;" title="Email Student">
                        <i class="fa-solid fa-envelope"></i>
                    </a>
                    <button type="button" class="btn-action delete btn-delete-reg" data-reg-id="${escapeHtml(reg.id)}" style="padding: 5px 8px; border-radius: 4px; border: none; cursor: pointer; color: #ef4444; background: #fef2f2;" title="Delete this response">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        tr.onmouseenter = () => { tr.style.backgroundColor = "#f8fafc"; };
        tr.onmouseleave = () => { tr.style.backgroundColor = "transparent"; };

        registrationsTableBody.appendChild(tr);
    });

    // Attach delete listeners
    const deleteButtons = document.querySelectorAll(".btn-delete-reg");
    deleteButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const regId = btn.getAttribute("data-reg-id");
            if (!regId) return;
            if (confirm("Delete this registration response?")) {
                const updated = getStoredRegistrations().filter(r => r.id !== regId);
                saveStoredRegistrations(updated);
                renderRegistrationsSection();
                showToast("Registration response deleted.");
            }
        });
    });
}

function exportRegistrationsToCsv() {
    const registrations = getStoredRegistrations();
    if (registrations.length === 0) {
        showToast("No registrations available to export.", "warning");
        return;
    }

    const headers = [
        "Registration ID",
        "Participant Name",
        "Student Roll Number",
        "Gmail",
        "Educational Qualification",
        "Course / Event Name",
        "Institution",
        "Phone Number",
        "Submission Timestamp",
        "Formatted Date",
        "Target Admin Email"
    ];

    const rows = registrations.map(r => [
        `"${(r.id || '').replace(/"/g, '""')}"`,
        `"${(r.fullName || '').replace(/"/g, '""')}"`,
        `"${(r.rollNumber || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.qualification || '').replace(/"/g, '""')}"`,
        `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
        `"${(r.institution || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.timestamp || '').replace(/"/g, '""')}"`,
        `"${(r.dateFormatted || '').replace(/"/g, '""')}"`,
        `"${(r.targetAdmin || ADMIN_NOTIFICATION_EMAIL).replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `birdlab_event_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded event registrations CSV.");
}

// Wire up registration toolbar event listeners
if (regSearchInput) {
    regSearchInput.addEventListener("input", renderRegistrationsSection);
}

if (regEventFilter) {
    regEventFilter.addEventListener("change", renderRegistrationsSection);
}

if (btnExportRegistrationsCsv) {
    btnExportRegistrationsCsv.addEventListener("click", exportRegistrationsToCsv);
}

if (btnClearRegistrations) {
    btnClearRegistrations.addEventListener("click", () => {
        const count = getStoredRegistrations().length;
        if (count === 0) {
            showToast("No registrations to clear.", "warning");
            return;
        }
        if (confirm(`Are you sure you want to clear all ${count} registrations?`)) {
            saveStoredRegistrations([]);
            renderRegistrationsSection();
            showToast("Cleared all event registrations.");
        }
    });
}

// =====================================================
// INITIALIZE
// =====================================================

refreshDashboard();