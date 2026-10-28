// =====================================================
// OPEN POSITIONS - BIRDLAB IIT JODHPUR
// Multi-Poster & Real-time Content Controller
// =====================================================

const OPEN_POSITIONS_API =
    "https://script.google.com/macros/s/AKfycbxd4kRsGOI8yJfFitPI37P6dLaROZfW7pcZo80DzMM3LHKIQjg0xrXS0O63tMYR2GvMEQ/exec";

const POSTERS_STORAGE_KEY = "birdlab_open_positions_posters";
const POSTER_STORAGE_KEY = "birdlab_open_positions_poster";
const POSTER_STATUS_KEY = "birdlab_open_positions_poster_status";
const CONTENT_STORAGE_KEY = "birdlab_open_positions_custom_content";
const DEFAULT_POSTER_SRC = "open_positions_poster.jpg.jpeg";

let activePostersList = [DEFAULT_POSTER_SRC];
let currentPosterIndex = 0;

// =====================================================
// LOAD & SYNC OPEN POSITIONS DATA
// =====================================================

async function loadOpenPositions() {
    // 1. Immediately apply any local admin customizations
    applyLocalCustomizations();

    // 2. Fetch live data from Google Sheets API
    try {
        const response = await fetch(OPEN_POSITIONS_API + "?t=" + Date.now());

        if (response.ok) {
            const data = await response.json();
            const content = data.content || {};
            applyCardContent(content);
        }
    } catch (error) {
        console.warn("Notice: Using local lab defaults for open positions.", error);
    }

    // 3. Sync poster state
    syncPosterState();
}

// =====================================================
// APPLY LOCAL CUSTOMIZATIONS (From Admin Panel)
// =====================================================

function applyLocalCustomizations() {
    try {
        const saved = localStorage.getItem(CONTENT_STORAGE_KEY);
        if (saved) {
            const content = JSON.parse(saved);
            if (content.card_title) setText("position-card-title", content.card_title);
            if (content.card_subtitle) setText("position-card-subtitle", content.card_subtitle);
            if (content.available_value) setText("available-value", content.available_value);
            if (content.contact_person) setText("contact-person", content.contact_person);
            if (content.email) {
                setText("email-address", content.email);
                const emailLink = document.getElementById("email-address");
                if (emailLink) emailLink.href = "mailto:" + content.email;
            }
            if (content.form_url) {
                const submitBtn = document.getElementById("submitProfileBtn");
                if (submitBtn) submitBtn.href = content.form_url;
            }
        }
    } catch (e) {
        console.warn("Error parsing local customizations:", e);
    }
}

// =====================================================
// APPLY GOOGLE SHEET DATA TO CARD
// =====================================================

function applyCardContent(content) {
    const hasLocal = localStorage.getItem(CONTENT_STORAGE_KEY);
    const localContent = hasLocal ? JSON.parse(hasLocal) : {};

    setText("position-card-title", localContent.card_title || content.card_title || "Research Opportunities & Open Positions");
    setText("position-card-subtitle", localContent.card_subtitle || content.card_subtitle || "Explore active recruitment announcements and submit your application.");

    setText("available-label", content.available_label || "AVAILABLE POSITIONS");
    setText("available-value", localContent.available_value || content.available_value);

    setText("contact-label", content.contact_label || "CONTACT PERSON");
    setText("contact-person", localContent.contact_person || content.contact_person || "Dr. Bhivraj Suthar");

    setText("email-label", content.email_label || "EMAIL");
    const email = localContent.email || content.email || "bhivraj@iitj.ac.in";
    setText("email-address", email);

    const emailAddress = document.getElementById("email-address");
    if (emailAddress) {
        emailAddress.href = "mailto:" + email;
    }

    if (content.notice_text) {
        setText("notice-text", content.notice_text);
    }

    const responsesBtn = document.getElementById("viewResponsesBtn");
    if (responsesBtn && content.responses_sheet_url) {
        responsesBtn.href = content.responses_sheet_url;
    }

    if (content.submit_button_text) {
        setText("submit-button-text", content.submit_button_text);
    }

    const submitBtn = document.getElementById("submitProfileBtn");
    const formUrl = localContent.form_url || content.form_url;
    if (submitBtn && formUrl) {
        submitBtn.href = formUrl;
    }

    // Google Sheets poster support (single or comma-separated list)
    if (content.poster_image_url && !localStorage.getItem(POSTERS_STORAGE_KEY) && !localStorage.getItem(POSTER_STORAGE_KEY) && localStorage.getItem(POSTER_STATUS_KEY) !== "removed") {
        const rawUrls = content.poster_image_url.split(",").map(u => u.trim()).filter(Boolean);
        if (rawUrls.length > 0) {
            activePostersList = rawUrls;
            currentPosterIndex = 0;
            renderCurrentPoster();
        }
    }
}

// =====================================================
// HELPER: SET TEXT CONTENT
// =====================================================

function setText(id, value) {
    const element = document.getElementById(id);
    if (!element || value === undefined || value === null || value === "") {
        return;
    }
    element.textContent = value;
}

// =====================================================
// MULTI-POSTER CONTROLS & LIGHTBOX HANDLERS
// =====================================================

function syncPosterState() {
    const posterStatus = localStorage.getItem(POSTER_STATUS_KEY) || "active";
    const activePosterContainer = document.getElementById("activePosterContainer");
    const noPosterContainer = document.getElementById("noPosterContainer");
    const posterBadge = document.getElementById("posterStatusBadge");

    if (posterStatus === "removed") {
        if (activePosterContainer) activePosterContainer.style.display = "none";
        if (noPosterContainer) noPosterContainer.style.display = "block";
        if (posterBadge) {
            posterBadge.textContent = "Openings Below";
            posterBadge.style.backgroundColor = "#f1f5f9";
            posterBadge.style.color = "#475569";
        }
    } else {
        if (activePosterContainer) activePosterContainer.style.display = "block";
        if (noPosterContainer) noPosterContainer.style.display = "none";
        if (posterBadge) {
            posterBadge.textContent = "Active Opening";
            posterBadge.style.backgroundColor = "#dafbe1";
            posterBadge.style.color = "#1a7f37";
        }

        activePostersList = getStoredPostersList();
        if (currentPosterIndex >= activePostersList.length) {
            currentPosterIndex = 0;
        }
        renderCurrentPoster();
    }
}

// Retrieve stored poster array (supports multi-poster array or legacy single poster)
function getStoredPostersList() {
    try {
        const multiPosters = localStorage.getItem(POSTERS_STORAGE_KEY);
        if (multiPosters) {
            const parsed = JSON.parse(multiPosters);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }

        const singlePoster = localStorage.getItem(POSTER_STORAGE_KEY);
        if (singlePoster) {
            return [singlePoster];
        }
    } catch (e) {
        console.warn("Notice: Error parsing stored posters list:", e);
    }
    return [DEFAULT_POSTER_SRC];
}

// Render the current poster into the page and lightbox modal
function renderCurrentPoster() {
    if (!activePostersList || activePostersList.length === 0) {
        activePostersList = [DEFAULT_POSTER_SRC];
    }

    if (currentPosterIndex < 0) currentPosterIndex = 0;
    if (currentPosterIndex >= activePostersList.length) currentPosterIndex = activePostersList.length - 1;

    const currentSrc = activePostersList[currentPosterIndex];
    const posterImg = document.getElementById("posterImage");
    const downloadBtn = document.getElementById("downloadPosterBtn");
    const modalDownloadBtn = document.getElementById("modalDownloadBtn");
    const modalImg = document.getElementById("modalPosterImage");
    const counterBadge = document.getElementById("posterCounterBadge");
    const modalCounter = document.getElementById("modalPosterCounter");
    const prevBtn = document.getElementById("prevPosterBtn");
    const nextBtn = document.getElementById("nextPosterBtn");
    const modalPrev = document.getElementById("modalPrevBtn");
    const modalNext = document.getElementById("modalNextBtn");
    const dotsContainer = document.getElementById("posterDotsContainer");

    const total = activePostersList.length;
    const currentNum = currentPosterIndex + 1;
    const downloadFilename = total > 1
        ? `IITJ_BIRDLab_Recruitment_Poster_${currentNum}.jpg`
        : "IITJ_BIRDLab_Recruitment_Poster.jpg";

    if (posterImg) {
        posterImg.style.opacity = "0.7";
        posterImg.src = currentSrc;
        setTimeout(() => {
            posterImg.style.opacity = "1";
        }, 150);
    }

    if (modalImg) modalImg.src = currentSrc;

    if (downloadBtn) {
        downloadBtn.href = currentSrc;
        downloadBtn.setAttribute("download", downloadFilename);
    }

    if (modalDownloadBtn) {
        modalDownloadBtn.href = currentSrc;
        modalDownloadBtn.setAttribute("download", downloadFilename);
    }

    // Toggle multi-poster navigation elements
    if (total > 1) {
        if (counterBadge) {
            counterBadge.style.display = "inline-block";
            counterBadge.textContent = `Poster ${currentNum} of ${total}`;
        }
        if (modalCounter) {
            modalCounter.style.display = "inline-block";
            modalCounter.textContent = `Poster ${currentNum} of ${total}`;
        }
        if (prevBtn) prevBtn.style.display = "flex";
        if (nextBtn) nextBtn.style.display = "flex";
        if (modalPrev) modalPrev.style.display = "flex";
        if (modalNext) modalNext.style.display = "flex";

        // Render Dots Pagination
        if (dotsContainer) {
            dotsContainer.style.display = "flex";
            dotsContainer.innerHTML = "";
            activePostersList.forEach((_, idx) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = "poster-dot" + (idx === currentPosterIndex ? " active" : "");
                dot.setAttribute("aria-label", `View Poster ${idx + 1}`);
                dot.title = `Poster ${idx + 1} of ${total}`;
                dot.addEventListener("click", () => {
                    currentPosterIndex = idx;
                    renderCurrentPoster();
                });
                dotsContainer.appendChild(dot);
            });
        }
    } else {
        if (counterBadge) counterBadge.style.display = "none";
        if (modalCounter) modalCounter.style.display = "none";
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        if (modalPrev) modalPrev.style.display = "none";
        if (modalNext) modalNext.style.display = "none";
        if (dotsContainer) {
            dotsContainer.style.display = "none";
            dotsContainer.innerHTML = "";
        }
    }
}

function prevPoster() {
    if (!activePostersList || activePostersList.length <= 1) return;
    currentPosterIndex = (currentPosterIndex - 1 + activePostersList.length) % activePostersList.length;
    renderCurrentPoster();
}

function nextPoster() {
    if (!activePostersList || activePostersList.length <= 1) return;
    currentPosterIndex = (currentPosterIndex + 1) % activePostersList.length;
    renderCurrentPoster();
}

function initPosterHandlers() {
    const viewModalBtn = document.getElementById("viewPosterModalBtn");
    const openPosterSecondaryBtn = document.getElementById("openPosterSecondaryBtn");
    const modal = document.getElementById("posterModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const posterImg = document.getElementById("posterImage");
    const prevBtn = document.getElementById("prevPosterBtn");
    const nextBtn = document.getElementById("nextPosterBtn");
    const modalPrev = document.getElementById("modalPrevBtn");
    const modalNext = document.getElementById("modalNextBtn");

    const openModal = () => {
        if (!modal) return;
        renderCurrentPoster();
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    };

    if (viewModalBtn) viewModalBtn.addEventListener("click", openModal);
    if (openPosterSecondaryBtn) openPosterSecondaryBtn.addEventListener("click", openModal);
    if (posterImg) {
        posterImg.style.cursor = "zoom-in";
        posterImg.addEventListener("click", openModal);
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

    // Slider arrow handlers
    if (prevBtn) prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        prevPoster();
    });

    if (nextBtn) nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        nextPoster();
    });

    if (modalPrev) modalPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        prevPoster();
    });

    if (modalNext) modalNext.addEventListener("click", (e) => {
        e.stopPropagation();
        nextPoster();
    });

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Keyboard accessibility: Left/Right arrows to flip posters, ESC to close modal
    document.addEventListener("keydown", (e) => {
        if (modal && modal.classList.contains("active")) {
            if (e.key === "Escape") {
                closeModal();
            } else if (e.key === "ArrowLeft") {
                prevPoster();
            } else if (e.key === "ArrowRight") {
                nextPoster();
            }
        } else if (activePostersList && activePostersList.length > 1) {
            if (e.key === "ArrowLeft") {
                prevPoster();
            } else if (e.key === "ArrowRight") {
                nextPoster();
            }
        }
    });

    // Real-time listener for multi-poster changes made by Admin in another tab
    window.addEventListener("storage", (e) => {
        if (e.key === POSTERS_STORAGE_KEY || e.key === POSTER_STORAGE_KEY || e.key === POSTER_STATUS_KEY) {
            syncPosterState();
        } else if (e.key === CONTENT_STORAGE_KEY) {
            applyLocalCustomizations();
        }
    });
}

// =====================================================
// INIT ON DOM READY
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    loadOpenPositions();
    initPosterHandlers();
});