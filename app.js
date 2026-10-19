
const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbx5XnFAMF0Sp0M5SXYA1v3RPFGt4XyJgwneAQFSXG2d_93pNRWWhxWs5zH00VA7ewTmpA/exec";

// ========================================
// GET FIELD FROM GOOGLE SHEETS
// ========================================

function getField(data, possibleNames) {
    for (const name of possibleNames) {
        const matchingKey = Object.keys(data).find(
            key => key.trim().toLowerCase() === name.toLowerCase()
        );

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

// ========================================
// UPDATE EXISTING FEATURED BHIVRAJ CARD
// ========================================

function isBhivrajProfile(profile) {
    const name = getField(profile, ["Name", "Full Name"])
        .toLowerCase()
        .replace(/^dr\.?\s*/, "")
        .trim();

    return name === "bhivraj suthar";
}

function updateFeaturedProfile(profile) {
    const fields = {
        featuredName: ["Name", "Full Name"],
        featuredRole: ["Current Role", "Role"],
        featuredOrganization: ["Affiliation", "Organization"],
        featuredAbout: ["About", "Description"],
        featuredResearch: ["Research Interests", "Research"],
        featuredEducation: ["Education"]
    };

    Object.entries(fields).forEach(([id, keys]) => {
        const element = document.getElementById(id);
        const value = getField(profile, keys);

        if (element && value) {
            element.textContent = value;
        }
    });

    const email = getField(profile, ["Email ID", "Email"]);
    const linkedin = getField(profile, ["LinkedIn Profile", "LinkedIn"]);

    const emailLink = document.getElementById("featuredEmail");
    if (emailLink && email) {
        emailLink.href = "mailto:" + email;
    }

    const linkedinLink = document.getElementById("featuredLinkedin");
    if (linkedinLink && linkedin) {
        if (/^https?:\/\//i.test(linkedin)) {
            linkedinLink.href = linkedin;
        } else {
            linkedinLink.removeAttribute("href");
        }
    }
}

// ========================================
// LOAD MEMBERS FROM GOOGLE SHEETS
// ========================================

async function loadGoogleProfiles() {
    const container = document.getElementById("otherMembers");

    if (!container) {
        console.error("otherMembers element not found");
        return;
    }

    container.innerHTML = '<div class="no-members">Loading members...</div>';

    try {
        const response = await fetch(
            GOOGLE_SHEET_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Could not connect to Google Apps Script");
        }

        const result = await response.json();
        console.log("Google Sheets response:", result);

        let profiles = [];

        if (Array.isArray(result)) {
            profiles = result;
        } else if (Array.isArray(result.profiles)) {
            profiles = result.profiles;
        } else if (result.success === false) {
            throw new Error(result.error || result.message || "Apps Script error");
        }

        profiles = profiles.filter(profile => {
            const status = getField(profile, ["Status"]);
            return !status || status.toLowerCase() === "approved";
        });

        // Update the existing featured card.
        const featuredProfile = profiles.find(isBhivrajProfile);

        if (featuredProfile) {
            updateFeaturedProfile(featuredProfile);
        }

        // Never create another card for the featured professor.
        const otherProfiles = profiles.filter(
            profile => !isBhivrajProfile(profile)
        );

        container.innerHTML = "";

        if (otherProfiles.length === 0) {
            container.innerHTML = `
                <div class="no-members">
                    No other members have joined yet.
                </div>
            `;
            return;
        }

        otherProfiles.forEach(profile => {
            container.appendChild(createMemberCard(profile));
        });

    } catch (error) {
        console.error("Error loading Google Sheets profiles:", error);

        container.innerHTML = `
            <div class="no-members">
                Unable to load member profiles. Please try again later.
            </div>
        `;
    }
}

// ========================================
// CREATE OTHER MEMBER CARDS
// ========================================

function createMemberCard(data) {
    const card = document.createElement("div");
    card.className = "member-card";

    const name = getField(data, ["Name", "Full Name"]) || "Member";
    const role = getField(data, ["Current Role", "Role"]);
    const affiliation = getField(data, ["Affiliation", "Organization"]);
    const about = getField(data, ["About", "Description"]);
    const research = getField(data, ["Research Interests", "Research"]);
    const education = getField(data, ["Education"]);
    const email = getField(data, ["Email ID", "Email"]);
    const linkedin = getField(data, ["LinkedIn Profile", "LinkedIn"]);

    const photo = getField(data, [
        "Photo URL",
        "Photo",
        "Profile Photo",
        "Profile Picture",
        "Upload Photo",
        "Photo Upload"
    ]);

    const photoURL = convertDriveURL(photo);

    let detailsHTML = "";

    function addDetail(label, value) {
        if (!value || value === ".") return;

        detailsHTML += `
            <div class="dynamic-detail">
                <div class="dynamic-question">${escapeHTML(label)}</div>
                <div class="dynamic-answer">${escapeHTML(value)}</div>
            </div>
        `;
    }

    addDetail("Current Role", role);
    addDetail("Affiliation", affiliation);
    addDetail("About", about);
    addDetail("Research Interests", research);
    addDetail("Education", education);

    if (email) {
        detailsHTML += `
            <div class="dynamic-detail">
                <div class="dynamic-question">Email ID</div>
                <div class="dynamic-answer">
                    <a class="question-link"
                       href="mailto:${escapeAttribute(email)}">
                        ${escapeHTML(email)}
                    </a>
                </div>
            </div>
        `;
    }

    if (linkedin) {
        const isURL = /^https?:\/\//i.test(linkedin);

        detailsHTML += `
            <div class="dynamic-detail">
                <div class="dynamic-question">LinkedIn Profile</div>
                <div class="dynamic-answer">
                    ${
                        isURL
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

    card.innerHTML = `
        <div class="member-card-inner">
            <div class="member-photo-section">
                ${
                    photoURL
                        ? `<div class="member-photo-container">
                               <img src="${escapeAttribute(photoURL)}"
                                    class="member-photo"
                                    alt="${escapeAttribute(name)}">
                           </div>`
                        : `<div class="member-photo-placeholder">
                               Photo not available
                           </div>`
                }
            </div>

            <div class="member-info">
                <h3 class="member-name">${escapeHTML(name)}</h3>
                ${detailsHTML}
            </div>
        </div>
    `;

    return card;
}

// ========================================
// GOOGLE DRIVE PHOTO URL
// ========================================

function convertDriveURL(url) {
    if (!url) return "";

    url = String(url).trim();

    const match =
        url.match(/drive\.google\.com\/file\/d\/([^/?]+)/i) ||
        url.match(/drive\.google\.com\/open\?id=([^&]+)/i) ||
        url.match(/drive\.google\.com\/thumbnail\?id=([^&]+)/i);

    if (match) {
        return "https://drive.google.com/thumbnail?id=" +
            encodeURIComponent(match[1]) + "&sz=w800";
    }

    return url;
}

// ========================================
// ESCAPE HTML
// ========================================

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

// ========================================
// START
// ========================================

document.addEventListener("DOMContentLoaded", loadGoogleProfiles);
