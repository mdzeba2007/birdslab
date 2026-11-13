// =========================================================
// BIRD LAB — GOOGLE SHEETS MEMBER DIRECTORY
// =========================================================

const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbx5XnFAMF0Sp0M5SXYA1v3RPFGt4XyJgwneAQFSXG2d_93pNRWWhxWs5zH00VA7ewTmpA/exec";

const FEATURED_PROFILE_API =
    "https://script.google.com/macros/s/AKfycbwh4xozTzLUqwshZFRgIgFmPSUdPFORKv6A_TID9G9Akkbt4KC_AHWgzEY6K1v9g0uw/exec";


// =========================================================
// GET FIELD — MATCH GOOGLE SHEET HEADINGS
// =========================================================

function normalizeFieldName(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getField(data, possibleNames) {

    if (!data || typeof data !== "object") return "";

    const keys = Object.keys(data);

    for (const name of possibleNames) {

        const searchName = normalizeFieldName(name);

        const matchingKey = keys.find(key => {

            const actualKey = normalizeFieldName(key);

            return (
                actualKey === searchName ||
                actualKey.startsWith(searchName)
            );
        });

        if (
            matchingKey &&
            data[matchingKey] !== null &&
            data[matchingKey] !== undefined &&
            String(data[matchingKey]).trim() !== ""
        ) {
            return String(data[matchingKey]).trim();
        }
    }

    return "";
}


// =========================================================
// FEATURED PROFESSOR — SEPARATE GOOGLE SHEET
// =========================================================

async function loadFeaturedProfileFromSheet() {

    try {

        const response = await fetch(
            FEATURED_PROFILE_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Featured profile API error: " + response.status);
        }

        const profile = await response.json();

        console.log("Featured Professor Data:", profile);

        if (profile.success === false) {
            throw new Error(profile.error || "Featured profile API error");
        }

        const fields = {

            featuredName: ["Name", "Full Name"],

            featuredRole: ["Current Role", "Role"],

            featuredOrganization: ["Affiliation", "Organization"],

            featuredAbout: ["About", "Description"],

            featuredResearch: [
                "Research Interests",
                "Research"
            ],

            featuredEducation: ["Education"]

        };

        Object.entries(fields).forEach(([id, keys]) => {

            const element = document.getElementById(id);

            const value = getField(profile, keys);

            if (element && value) {
                element.textContent = value;
            }

        });


        // Education Degree

        const degree = getField(profile, [
            "Education Degree"
        ]);

        const degreeElement = document.getElementById(
            "featuredEducationDegree"
        );

        if (degreeElement && degree) {
            degreeElement.textContent = degree;
        }


        // Profile Photo

        const photo = getField(profile, [
            "Photo URL",
            "Upload your current photo",
            "Photo"
        ]);

        const imageElement = document.getElementById(
            "featuredImage"
        );

        if (imageElement && photo) {
            imageElement.referrerPolicy = "no-referrer";
            imageElement.src = convertDriveURL(photo, 1000);
            const driveId = extractDriveId(photo);
            if (driveId) {
                imageElement.setAttribute("data-drive-id", driveId);
                imageElement.onerror = function () {
                    if (window.handleMemberPhotoError) {
                        window.handleMemberPhotoError(this);
                    } else {
                        this.src = "Bhivrajsuthar.png";
                    }
                };
            }
        }


        // Email

        const email = getField(profile, [
            "Email ID(Institute)",
            "Email ID",
            "Email"
        ]);

        const emailLink = document.getElementById(
            "featuredEmail"
        );

        if (emailLink && email) {
            emailLink.href = "mailto:" + email;
        }


        // LinkedIn

        const linkedin = getField(profile, [
            "LinkedIn Profile",
            "LinkedIn",
            "Linkedin profile(URL LINK)"
        ]);

        const linkedinLink = document.getElementById(
            "featuredLinkedin"
        );

        if (linkedinLink && linkedin) {

            if (/^https?:\/\//i.test(linkedin)) {
                linkedinLink.href = linkedin;
            }

        }

        console.log("Featured Professor updated successfully.");

    } catch (error) {

        console.error(
            "Error loading Featured Professor:",
            error
        );

    }
}


// =========================================================
// IDENTIFY DR. BHIVRAJ
// =========================================================

function isBhivrajProfile(profile) {

    const name = getField(profile, [
        "Full Name",
        "Name"
    ])
        .toLowerCase()
        .replace(/^dr\.?\s*/, "")
        .trim();

    return name === "bhivraj suthar";
}


// =========================================================
// EDUCATION CATEGORY MAPPING
// =========================================================

function getCategory(education) {

    const value = normalizeFieldName(education);


    // Post Doctoral Fellows

    if (
        value.includes("postdoctoral") ||
        value.includes("postdoc") ||
        value.includes("scientist")
    ) {
        return "postDoctoralMembers";
    }


    // PhD Scholars

    if (
        value.includes("phd") ||
        value.includes("doctoral")
    ) {
        return "phdMembers";
    }


    // Project Staff

    if (
        value.includes("projectstaff")
    ) {
        return "projectStaffMembers";
    }


    // Master Students

    if (
        value.includes("masterstudent") ||
        value === "mtech" ||
        value.includes("mtechstudent")
    ) {
        return "masterMembers";
    }


    // Bachelor Students

    if (
        value.includes("bachelorstudent") ||
        value === "btech" ||
        value.includes("btechstudent")
    ) {
        return "bachelorMembers";
    }


    return "otherMembers";
}


// =========================================================
// LOAD MEMBERS FROM GOOGLE SHEETS
// =========================================================

let memberLoadInProgress = false;

async function loadGoogleProfiles() {

    if (memberLoadInProgress) return;

    memberLoadInProgress = true;

    const categoryNames = {

        postDoctoralMembers:
            "Post-Doctoral Fellows / Scientists",

        phdMembers:
            "PhD Scholars",

        projectStaffMembers:
            "Project Staff",

        masterMembers:
            "Master Students",

        bachelorMembers:
            "Bachelor Students",

        otherMembers:
            "Other Members"

    };


    // Get all category containers

    const containers = {};

    Object.keys(categoryNames).forEach(id => {

        containers[id] = document.getElementById(id);

    });


    if (!containers.otherMembers) {

        console.error(
            "Member containers not found in people.html."
        );

        memberLoadInProgress = false;
        return;
    }


    // Show loading message

    Object.values(containers).forEach(container => {

        if (container) {

            container.innerHTML =
                '<div class="no-members">Loading members...</div>';

        }

    });


    try {

        // Fetch latest Google Sheets data

        const response = await fetch(
            GOOGLE_SHEET_API + "?t=" + Date.now()
        );

        if (!response.ok) {

            throw new Error(
                "Could not connect to Google Sheets: " +
                response.status
            );

        }


        const result = await response.json();

        console.log(
            "Member Google Sheets response:",
            result
        );


        // Extract profiles

        let profiles = [];

        if (Array.isArray(result)) {

            profiles = result;

        } else if (Array.isArray(result.profiles)) {

            profiles = result.profiles;

        } else if (Array.isArray(result.data)) {

            profiles = result.data;

        } else if (Array.isArray(result.members)) {

            profiles = result.members;

        } else if (result.success === false) {

            throw new Error(
                result.error ||
                result.message ||
                "Member API error"
            );

        } else {

            throw new Error(
                "Unexpected Google Sheets response format."
            );

        }


        console.log(
            "Total profiles received:",
            profiles.length
        );


        // Only display approved profiles.
        // Blank status is allowed, preserving previous behaviour.

        profiles = profiles.filter(profile => {

            const status = getField(profile, [
                "Status"
            ]);

            return (
                !status ||
                status.toLowerCase() === "approved"
            );

        });


        // Avoid duplicate Featured Professor card

        profiles = profiles.filter(
            profile => !isBhivrajProfile(profile)
        );


        // Clear old cards

        Object.values(containers).forEach(container => {

            if (container) {
                container.innerHTML = "";
            }

        });


        // Category counters

        const counts = {};

        Object.keys(categoryNames).forEach(id => {

            counts[id] = 0;

        });


        // Create and display member cards

        profiles.forEach(profile => {

            const education = getField(profile, [
                "Education"
            ]);

            const categoryId = getCategory(education);

            let container = containers[categoryId];


            // If category container is unavailable,
            // display the member under Other Members.

            if (!container) {

                container = containers.otherMembers;

                counts.otherMembers++;

            } else {

                counts[categoryId]++;

            }


            const memberCard = createMemberCard(profile);

            container.appendChild(memberCard);

        });


        // Display empty category messages

        Object.entries(containers).forEach(
            ([id, container]) => {

                if (
                    container &&
                    counts[id] === 0
                ) {

                    container.innerHTML = `
                        <div class="no-members">
                            No members in ${categoryNames[id]} yet.
                        </div>
                    `;

                }

            }
        );


        console.log("Member directory updated successfully.");

        console.log("Category counts:", counts);


    } catch (error) {

        console.error(
            "Error loading member profiles:",
            error
        );


        Object.values(containers).forEach(container => {

            if (container) {

                container.innerHTML = `
                    <div class="no-members">
                        Unable to load member profiles.
                        Please try again later.
                    </div>
                `;

            }

        });

    } finally {

        memberLoadInProgress = false;

    }

}


// =========================================================
// CREATE MEMBER CARD
// =========================================================

function createMemberCard(data) {

    const card = document.createElement("div");

    card.className = "member-card";


    // Basic details

    const name = getField(data, [
        "Full Name",
        "Name"
    ]) || "Member";


    const role = getField(data, [
        "Current Role",
        "Current role",
        "Role"
    ]);


    const affiliation = getField(data, [
        "Affiliation",
        "Organization"
    ]);


    const about = getField(data, [
        "About",
        "Description"
    ]);


    const research = getField(data, [
        "Research Interests",
        "Research"
    ]);


    const education = getField(data, [
        "Education"
    ]);


    const email = getField(data, [
        "Email ID(Institute)",
        "Email ID",
        "Email"
    ]);


    const linkedin = getField(data, [
        "LinkedIn Profile",
        "LinkedIn",
        "Linkedin profile(URL LINK)"
    ]);


    // Photo field

    const photo = getField(data, [

        "Upload your current photo",

        "Photo URL",

        "Photo",

        "Profile Photo",

        "Profile Picture",

        "Upload Photo",

        "Photo Upload"

    ]);


    const driveId = extractDriveId(photo);
    const photoURL = convertDriveURL(photo, 1000);


    // Member details HTML

    let detailsHTML = "";


    function addDetail(label, value) {

        if (!value || value === ".") return;

        detailsHTML += `
            <div class="dynamic-detail">

                <div class="dynamic-question">
                    ${escapeHTML(label)}
                </div>

                <div class="dynamic-answer">
                    ${escapeHTML(value)}
                </div>

            </div>
        `;

    }


    // Add member information

    addDetail("Current Role", role);

    addDetail("Affiliation", affiliation);

    addDetail("About", about);

    addDetail("Research Interests", research);

    addDetail("Education", education);


    // Email link

    if (email) {

        detailsHTML += `

            <div class="dynamic-detail">

                <div class="dynamic-question">
                    Email ID
                </div>

                <div class="dynamic-answer">

                    <a class="question-link"
                       href="mailto:${escapeAttribute(email)}">

                        ${escapeHTML(email)}

                    </a>

                </div>

            </div>

        `;

    }


    // LinkedIn link

    if (linkedin) {

        const validLinkedin =
            /^https?:\/\//i.test(linkedin);

        detailsHTML += `

            <div class="dynamic-detail">

                <div class="dynamic-question">
                    LinkedIn Profile
                </div>

                <div class="dynamic-answer">

                    ${
                        validLinkedin

                            ? `<a class="question-link"
                                  href="${escapeAttribute(linkedin)}"
                                  target="_blank"
                                  rel="noopener noreferrer">
                                  View LinkedIn Profile
                               </a>`

                            : escapeHTML(linkedin)
                    }

                </div>

            </div>

        `;

    }


    // Final card HTML

    card.innerHTML = `

        <div class="member-card-inner">


            <!-- MEMBER PHOTO -->

            <div class="member-photo-section">

                ${
                    photoURL

                        ? `
                            <div class="member-photo-container">

                                <img
                                    src="${escapeAttribute(photoURL)}"
                                    class="member-photo"
                                    alt="${escapeAttribute(name)}"
                                    loading="lazy"
                                    referrerpolicy="no-referrer"
                                    data-drive-id="${escapeAttribute(driveId || "")}"
                                    onerror="window.handleMemberPhotoError && window.handleMemberPhotoError(this)"
                                >

                            </div>
                        `

                        : `
                            <div class="member-photo-placeholder">
                                <div class="photo-fallback-ui">
                                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <span class="fallback-name">${escapeHTML(name)}</span>
                                </div>
                            </div>
                        `
                }

            </div>


            <!-- MEMBER INFORMATION -->

            <div class="member-info">

                <h3 class="member-name">
                    ${escapeHTML(name)}
                </h3>

                ${detailsHTML}

            </div>


        </div>

    `;


    return card;

}


// =========================================================
// GOOGLE DRIVE ID EXTRACTION & PHOTO URL CONVERSION
// =========================================================

export function extractDriveId(url) {
    if (!url) return null;
    url = String(url).trim();

    // If already a Data URI or blob, do not treat as Drive URL
    if (url.startsWith("data:") || url.startsWith("blob:")) {
        return null;
    }

    // If multiple URLs were entered (e.g. comma-separated in Google Forms), take the first
    if (url.includes(",")) {
        url = url.split(",")[0].trim();
    }

    // 1. Match /file/d/<id> or /d/<id>
    const fileDMatch = url.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]{20,})/i);
    if (fileDMatch) return fileDMatch[1];

    // 2. Match id=<id> in query params (uc?id=..., uc?export=view&id=..., open?id=..., thumbnail?id=..., etc.)
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
    if (idParamMatch) return idParamMatch[1];

    // 3. Match drive.usercontent.google.com/download?id=<id>
    const userContentMatch = url.match(/drive\.usercontent\.google\.com\/download\?.*id=([a-zA-Z0-9_-]{20,})/i);
    if (userContentMatch) return userContentMatch[1];

    // 4. Raw Google Drive File ID string (25-50 characters)
    if (/^[a-zA-Z0-9_-]{25,50}$/.test(url)) {
        return url;
    }

    return null;
}

export function convertDriveURL(url, width = 1000) {
    if (!url) return "";
    url = String(url).trim();

    // Directly return Data URIs (Base64) or blob URLs
    if (url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    const driveId = extractDriveId(url);
    if (driveId) {
        // High-resolution Google Drive CDN endpoint (crisp 1000px width)
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(driveId)}=w${width}`;
    }

    return url;
}

// Global handler for photo load errors with multi-stage fallback
window.handleMemberPhotoError = function (img) {
    if (!img) return;

    const driveId = img.getAttribute("data-drive-id");
    const step = parseInt(img.getAttribute("data-error-step") || "0", 10);

    // If it's a data URI or local image that somehow failed, jump straight to fallback
    const currentSrc = img.getAttribute("src") || "";
    if (currentSrc.startsWith("data:")) {
        showPhotoFallback(img);
        return;
    }

    // Fallback step 1: Try drive.google.com/thumbnail with high resolution
    if (driveId && step === 0) {
        img.setAttribute("data-error-step", "1");
        img.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1000`;
        return;
    }

    // Fallback step 2: Try drive.usercontent.google.com direct download endpoint
    if (driveId && step === 1) {
        img.setAttribute("data-error-step", "2");
        img.src = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(driveId)}&export=view`;
        return;
    }

    // Final fallback: Show clean stylized avatar placeholder (no broken image icon)
    showPhotoFallback(img);
};

function showPhotoFallback(img) {
    const container = img.closest(".member-photo-container");
    const memberName = img.getAttribute("alt") || "Member";

    if (container) {
        container.className = "member-photo-placeholder";
        container.innerHTML = `
            <div class="photo-fallback-ui">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="fallback-name">${memberName.replace(/[<>&"']/g, "")}</span>
            </div>
        `;
    } else {
        img.style.display = "none";
    }
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value = "") {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


function escapeAttribute(value = "") {

    return escapeHTML(value);

}


// =========================================================
// START LOADERS + AUTOMATIC REFRESH
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // Initial loading

    loadFeaturedProfileFromSheet();

    loadGoogleProfiles();


    // Automatically refresh every 30 seconds

    setInterval(() => {

        loadFeaturedProfileFromSheet();

        loadGoogleProfiles();

    }, 30000);

});