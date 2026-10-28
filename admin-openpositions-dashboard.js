import { auth } from "./firebase2.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// =====================================================
// SECURITY AUTH GUARD
// =====================================================

const sessionEmail = sessionStorage.getItem("birdlab_openpositions_admin_auth");
if (!sessionEmail) {
    window.location.replace("admin-openpositions.html");
}

// =====================================================
// CONSTANTS & STORAGE KEYS
// =====================================================

const POSTERS_STORAGE_KEY = "birdlab_open_positions_posters";
const POSTER_STORAGE_KEY = "birdlab_open_positions_poster";
const POSTER_STATUS_KEY = "birdlab_open_positions_poster_status";
const CONTENT_STORAGE_KEY = "birdlab_open_positions_custom_content";
const DEFAULT_POSTER_SRC = "open_positions_poster.jpg";

// Elements - User & Header
const userEmailBadge = document.getElementById("userEmailBadge");
const logoutBtn = document.getElementById("logoutBtn");

// Elements - Posters
const posterStatusBadge = document.getElementById("posterStatusBadge");
const postersCountBadge = document.getElementById("postersCountBadge");
const adminPostersList = document.getElementById("adminPostersList");
const removedPosterNotice = document.getElementById("removedPosterNotice");
const posterFileInput = document.getElementById("posterFileInput");
const posterDropzone = document.getElementById("posterDropzone");
const pendingPostersContainer = document.getElementById("pendingPostersContainer");
const pendingCountText = document.getElementById("pendingCountText");
const pendingThumbsRow = document.getElementById("pendingThumbsRow");
const saveUploadedPosterBtn = document.getElementById("saveUploadedPosterBtn");
const cancelUploadBtn = document.getElementById("cancelUploadBtn");
const removePosterBtn = document.getElementById("removePosterBtn");
const restoreDefaultPosterBtn = document.getElementById("restoreDefaultPosterBtn");

// Elements - Content
const editCardTitle = document.getElementById("editCardTitle");
const editCardSubtitle = document.getElementById("editCardSubtitle");
const editAvailablePositions = document.getElementById("editAvailablePositions");
const editContactPerson = document.getElementById("editContactPerson");
const editEmail = document.getElementById("editEmail");
const editApplicationFormUrl = document.getElementById("editApplicationFormUrl");
const saveContentBtn = document.getElementById("saveContentBtn");
const resetContentBtn = document.getElementById("resetContentBtn");

// Elements - Toast
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

let pendingPostersArray = [];
let toastTimeout = null;

// Display authorized user badge
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
        sessionStorage.removeItem("birdlab_openpositions_admin_auth");
        window.location.replace("admin-openpositions.html");
    });
}

// =====================================================
// MULTI-POSTER STORAGE HELPERS
// =====================================================

function getStoredPosters() {
    try {
        const storedList = localStorage.getItem(POSTERS_STORAGE_KEY);
        if (storedList) {
            const parsed = JSON.parse(storedList);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }

        const singlePoster = localStorage.getItem(POSTER_STORAGE_KEY);
        if (singlePoster) {
            return [singlePoster];
        }
    } catch (e) {
        console.warn("Notice: Error parsing stored posters:", e);
    }
    return [DEFAULT_POSTER_SRC];
}

function saveStoredPosters(posters) {
    if (!Array.isArray(posters) || posters.length === 0) {
        localStorage.removeItem(POSTERS_STORAGE_KEY);
        localStorage.removeItem(POSTER_STORAGE_KEY);
    } else {
        localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(posters));
        localStorage.setItem(POSTER_STORAGE_KEY, posters[0]);
    }
}

// =====================================================
// POSTER MANAGEMENT & DASHBOARD REFRESH
// =====================================================

function refreshDashboardPosterState() {
    const posterStatus = localStorage.getItem(POSTER_STATUS_KEY) || "active";
    const posters = getStoredPosters();

    if (postersCountBadge) {
        postersCountBadge.textContent = `(${posters.length} Active)`;
    }

    if (posterStatus === "removed") {
        if (posterStatusBadge) {
            posterStatusBadge.textContent = "Removed / Hidden";
            posterStatusBadge.className = "badge badge-removed";
        }
        if (adminPostersList) adminPostersList.style.display = "none";
        if (removedPosterNotice) removedPosterNotice.style.display = "block";
        if (removePosterBtn) removePosterBtn.style.display = "none";
        if (restoreDefaultPosterBtn) restoreDefaultPosterBtn.style.display = "inline-flex";
    } else {
        if (posterStatusBadge) {
            posterStatusBadge.textContent = "Active on Site";
            posterStatusBadge.className = "badge badge-active";
        }
        if (adminPostersList) adminPostersList.style.display = "flex";
        if (removedPosterNotice) removedPosterNotice.style.display = "none";
        if (removePosterBtn) removePosterBtn.style.display = "inline-flex";
    }

    renderAdminPostersList(posters);
}

// Render dynamic list of active posters with move up/down and delete
function renderAdminPostersList(posters) {
    if (!adminPostersList) return;
    adminPostersList.innerHTML = "";

    if (!posters || posters.length === 0) {
        adminPostersList.innerHTML = `
            <div style="text-align: center; padding: 25px; color: #64748b; font-size: 13.5px;">
                <i class="fa-regular fa-image" style="font-size: 28px; margin-bottom: 8px; display: block;"></i>
                No posters currently active. Upload a poster below.
            </div>
        `;
        return;
    }

    posters.forEach((posterSrc, index) => {
        const item = document.createElement("div");
        item.className = "poster-card-item" + (index === 0 ? " primary" : "");

        const isPrimary = index === 0;
        const total = posters.length;

        item.innerHTML = `
            <div class="poster-card-left">
                <img src="${posterSrc}" alt="Poster ${index + 1}" class="poster-thumb-preview" title="Click to view full size">
                <div>
                    <div class="poster-info-title">
                        Poster ${index + 1}
                        <span class="poster-order-badge ${isPrimary ? 'primary' : ''}">
                            ${isPrimary ? '★ Primary (First Displayed)' : `#${index + 1}`}
                        </span>
                    </div>
                    <p style="font-size: 11.5px; color: #64748b;">
                        Displayed in public carousel
                    </p>
                </div>
            </div>

            <div class="poster-card-actions">
                ${index > 0 ? `
                    <button type="button" class="btn-icon-mini move-up-btn" data-index="${index}" title="Move Up">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                ` : ''}

                ${index < total - 1 ? `
                    <button type="button" class="btn-icon-mini move-down-btn" data-index="${index}" title="Move Down">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                ` : ''}

                <a href="${posterSrc}" target="_blank" download="BIRDLab_Poster_${index + 1}.jpg" class="btn-icon-mini" title="Download Poster">
                    <i class="fa-solid fa-download"></i>
                </a>

                <button type="button" class="btn-icon-mini btn-danger-mini delete-poster-btn" data-index="${index}" title="Delete this poster">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Click thumbnail to view full image in new tab
        const thumb = item.querySelector(".poster-thumb-preview");
        if (thumb) {
            thumb.addEventListener("click", () => {
                const win = window.open();
                win.document.write(`<img src="${posterSrc}" style="max-width: 100%; height: auto; margin: auto; display: block;"/>`);
            });
        }

        // Move Up
        const moveUpBtn = item.querySelector(".move-up-btn");
        if (moveUpBtn) {
            moveUpBtn.addEventListener("click", () => {
                movePoster(index, index - 1);
            });
        }

        // Move Down
        const moveDownBtn = item.querySelector(".move-down-btn");
        if (moveDownBtn) {
            moveDownBtn.addEventListener("click", () => {
                movePoster(index, index + 1);
            });
        }

        // Delete Single Poster
        const deleteBtn = item.querySelector(".delete-poster-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                deleteSinglePoster(index);
            });
        }

        adminPostersList.appendChild(item);
    });
}

function movePoster(fromIndex, toIndex) {
    const posters = getStoredPosters();
    if (toIndex < 0 || toIndex >= posters.length) return;

    const [moved] = posters.splice(fromIndex, 1);
    posters.splice(toIndex, 0, moved);

    saveStoredPosters(posters);
    refreshDashboardPosterState();
    showToast(`Poster order updated! (Poster #${fromIndex + 1} moved)`, "success");
}

function deleteSinglePoster(index) {
    const posters = getStoredPosters();
    const posterNum = index + 1;

    if (!confirm(`Are you sure you want to delete Poster #${posterNum}?`)) {
        return;
    }

    posters.splice(index, 1);

    if (posters.length === 0) {
        localStorage.setItem(POSTER_STATUS_KEY, "removed");
        saveStoredPosters([]);
        refreshDashboardPosterState();
        showToast("All posters removed. Recruitment poster section is now hidden.", "info");
    } else {
        saveStoredPosters(posters);
        refreshDashboardPosterState();
        showToast(`Poster #${posterNum} deleted successfully.`, "success");
    }
}

// =====================================================
// FILE PICKER & DROPZONE (MULTIPLE FILES)
// =====================================================

if (posterDropzone && posterFileInput) {
    posterDropzone.addEventListener("click", () => {
        posterFileInput.click();
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        posterDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            posterDropzone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        posterDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            posterDropzone.classList.remove("dragover");
        });
    });

    posterDropzone.addEventListener("drop", (e) => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (files.length > 0) {
            processMultiplePosters(files);
        } else {
            alert("Please drop valid image files (PNG, JPG, JPEG, WEBP).");
        }
    });

    posterFileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
        if (files.length > 0) {
            processMultiplePosters(files);
        }
        posterFileInput.value = "";
    });
}

// Process selected image files with automatic compression
function processMultiplePosters(files) {
    let processedCount = 0;
    const totalFiles = files.length;
    showToast(`Processing ${totalFiles} poster(s)...`, "info");

    files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            compressImage(event.target.result, 1800, 0.88, (compressedDataUrl) => {
                pendingPostersArray.push(compressedDataUrl);
                processedCount++;

                if (processedCount === totalFiles) {
                    renderPendingPosters();
                }
            });
        };
        reader.readAsDataURL(file);
    });
}

function renderPendingPosters() {
    if (!pendingPostersContainer || !pendingThumbsRow) return;

    if (pendingPostersArray.length === 0) {
        pendingPostersContainer.style.display = "none";
        return;
    }

    pendingPostersContainer.style.display = "block";
    pendingCountText.textContent = `${pendingPostersArray.length} New Poster(s) Ready to Add`;
    pendingThumbsRow.innerHTML = "";

    pendingPostersArray.forEach((dataUrl, idx) => {
        const img = document.createElement("img");
        img.src = dataUrl;
        img.className = "pending-thumb";
        img.title = `New poster ${idx + 1}`;
        pendingThumbsRow.appendChild(img);
    });

    showToast(`${pendingPostersArray.length} poster(s) ready. Click 'Publish Added Poster(s)' below.`, "success");
}

// Save all pending uploaded posters to the active list
if (saveUploadedPosterBtn) {
    saveUploadedPosterBtn.addEventListener("click", () => {
        if (pendingPostersArray.length === 0) return;

        try {
            const currentPosters = getStoredPosters();
            const posterStatus = localStorage.getItem(POSTER_STATUS_KEY);

            let updatedList = [];
            // If default poster was the only one or if previously removed, we start with the new ones or append
            if (currentPosters.length === 1 && currentPosters[0] === DEFAULT_POSTER_SRC && !localStorage.getItem(POSTERS_STORAGE_KEY) && !localStorage.getItem(POSTER_STORAGE_KEY)) {
                updatedList = [...pendingPostersArray];
            } else {
                updatedList = [...currentPosters, ...pendingPostersArray];
            }

            saveStoredPosters(updatedList);
            localStorage.setItem(POSTER_STATUS_KEY, "active");

            const addedCount = pendingPostersArray.length;
            pendingPostersArray = [];
            if (pendingPostersContainer) pendingPostersContainer.style.display = "none";

            refreshDashboardPosterState();
            showToast(`Successfully added ${addedCount} recruitment poster(s) to website!`, "success");
        } catch (err) {
            console.error("Storage error:", err);
            alert("Image file data is too large for browser storage. Please try adding smaller or fewer images at a time.");
        }
    });
}

// Cancel upload preview
if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener("click", () => {
        pendingPostersArray = [];
        if (pendingPostersContainer) pendingPostersContainer.style.display = "none";
        showToast("Upload cancelled.", "info");
    });
}

// Remove All Posters
if (removePosterBtn) {
    removePosterBtn.addEventListener("click", () => {
        const confirmed = confirm(
            "Are you sure you want to remove all recruitment posters from the public website?\n\nVisitors will see the open positions details without the poster carousel."
        );

        if (confirmed) {
            localStorage.setItem(POSTER_STATUS_KEY, "removed");
            pendingPostersArray = [];
            if (pendingPostersContainer) pendingPostersContainer.style.display = "none";
            refreshDashboardPosterState();
            showToast("All recruitment posters have been hidden from website.", "success");
        }
    });
}

// Restore Default Poster
if (restoreDefaultPosterBtn) {
    restoreDefaultPosterBtn.addEventListener("click", () => {
        localStorage.removeItem(POSTERS_STORAGE_KEY);
        localStorage.removeItem(POSTER_STORAGE_KEY);
        localStorage.setItem(POSTER_STATUS_KEY, "active");
        pendingPostersArray = [];
        if (pendingPostersContainer) pendingPostersContainer.style.display = "none";
        refreshDashboardPosterState();
        showToast("Default BIRDLab recruitment poster restored and activated!", "success");
    });
}

// HTML5 Canvas image compressor
function compressImage(dataUrl, maxDimension, quality, callback) {
    const img = new Image();
    img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const resultUrl = canvas.toDataURL("image/jpeg", quality);
        callback(resultUrl);
    };
    img.src = dataUrl;
}

// =====================================================
// CONTENT FIELDS MANAGEMENT
// =====================================================

function loadContentFields() {
    try {
        const saved = localStorage.getItem(CONTENT_STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.card_title && editCardTitle) editCardTitle.value = data.card_title;
            if (data.card_subtitle && editCardSubtitle) editCardSubtitle.value = data.card_subtitle;
            if (data.available_value && editAvailablePositions) editAvailablePositions.value = data.available_value;
            if (data.contact_person && editContactPerson) editContactPerson.value = data.contact_person;
            if (data.email && editEmail) editEmail.value = data.email;
            if (data.form_url && editApplicationFormUrl) editApplicationFormUrl.value = data.form_url;
        }
    } catch (e) {}
}

if (saveContentBtn) {
    saveContentBtn.addEventListener("click", () => {
        const content = {
            card_title: editCardTitle ? editCardTitle.value.trim() : "",
            card_subtitle: editCardSubtitle ? editCardSubtitle.value.trim() : "",
            available_value: editAvailablePositions ? editAvailablePositions.value.trim() : "",
            contact_person: editContactPerson ? editContactPerson.value.trim() : "",
            email: editEmail ? editEmail.value.trim() : "",
            form_url: editApplicationFormUrl ? editApplicationFormUrl.value.trim() : ""
        };

        localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
        showToast("Open positions content updated successfully!", "success");
    });
}

if (resetContentBtn) {
    resetContentBtn.addEventListener("click", () => {
        if (confirm("Reset positions details to laboratory defaults?")) {
            localStorage.removeItem(CONTENT_STORAGE_KEY);
            if (editCardTitle) editCardTitle.value = "Research Opportunities & Open Positions";
            if (editCardSubtitle) editCardSubtitle.value = "Explore active recruitment announcements and submit your application.";
            if (editAvailablePositions) editAvailablePositions.value = "Undergraduate Internship, Master's/Ph.D. courses, Post-Doc, and Research positions";
            if (editContactPerson) editContactPerson.value = "Dr. Bhivraj Suthar";
            if (editEmail) editEmail.value = "bhivraj@iitj.ac.in";
            if (editApplicationFormUrl) editApplicationFormUrl.value = "https://docs.google.com/forms/d/e/1FAIpQLSerNzLfHwIzAHgZ68fyjzUuVqHYYMmWj3Kjy_Qrki1R5jVWhA/viewform?usp=dialog";
            showToast("Settings reset to default.", "success");
        }
    });
}

// Initialize on load
refreshDashboardPosterState();
loadContentFields();
