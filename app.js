
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
// FEATURED BHIVRAJ PROFILE
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
// CATEGORY MAPPING
// ========================================

function getCategory(education) {
    const value = String(education)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    if (
        value.includes("postdoctoral") ||
        value.includes("postdoc") ||
        value.includes("scientist")
    ) {
        return "postDoctoralMembers";
    }

    if (
        value.includes("phd") ||
        value.includes("doctoral")
    ) {
        return "phdMembers";
    }

    if (value.includes("projectstaff")) {
        return "projectStaffMembers";
    }

    if (
        value.includes("masterstudent") ||
        value === "masterstudents" ||
        value === "mtech" ||
        value.includes("mtechstudent")
    ) {
        return "masterMembers";
    }

    if (
        value.includes("bachelorstudent") ||
        value === "bachelorstudents" ||
        value === "btech" ||
        value.includes("btechstudent")
    ) {
        return "bachelorMembers";
    }

    return "otherMembers";
}

// ========================================
// LOAD MEMBERS FROM GOOGLE SHEETS
// ========================================

async function loadGoogleProfiles() {
    const categoryContainers = {
        postDoctoralMembers: "Post-Doctoral Fellows / Scientists",
        phdMembers: "PhD Scholars",
        projectStaffMembers: "Project Staff",
        masterMembers: "Master Students",
        bachelorMembers: "Bachelor Students",
        otherMembers: "Other Members"
    };

    const containers = {};

    Object.entries(categoryContainers).forEach(([id, title]) => {
        containers[id] = document.getElementById(id);
    });

    if (!containers.otherMembers) {
        console.error(
            "Member containers not found. Check the IDs in people.html."
        );
        return;
    }

    Object.values(containers).forEach(container => {
        if (container) {
            container.innerHTML =
                '<div class="no-members">Loading members...</div>';
        }
    });

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
            throw new Error(
                result.error || result.message || "Apps Script error"
            );
        }

        profiles = profiles.filter(profile => {
            const status = getField(profile, ["Status"]);
            return !status || status.toLowerCase() === "approved";
        });

        // Update the existing featured professor card.
        const featuredProfile = profiles.find(isBhivrajProfile);

        if (featuredProfile) {
            updateFeaturedProfile(featuredProfile);
        }

        // Clear all category containers.
        Object.values(containers).forEach(container => {
            if (container) {
                container.innerHTML = "";
            }
        });

        const counts = {};

        Object.keys(categoryContainers).forEach(id => {
            counts[id] = 0;
        });

        // Sort approved profiles into their categories.
        profiles
            .filter(profile => !isBhivrajProfile(profile))
            .forEach(profile => {
                const education = getField(profile, ["Education"]);
                const categoryId = getCategory(education);

                let container = containers[categoryId];

                // If a category container is missing,
                // place the profile under Other Members.
                if (!container) {
                    container = containers.otherMembers;
                    counts.otherMembers++;
                } else {
                    counts[categoryId]++;
                }

                container.appendChild(createMemberCard(profile));
            });

        // Display a message when a category is empty.
        Object.entries(containers).forEach(([id, container]) => {
            if (container && counts[id] === 0) {
                container.innerHTML = `
                    <div class="no-members">
                        No ${categoryContainers[id].toLowerCase()}
                        have joined yet.
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("Error loading Google Sheets profiles:", error);

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
    }
}

// ========================================
// CREATE MEMBER CARDS
// ========================================

function createMemberCard(data) {
    const card = document.createElement("div");
    card.className = "member-card";

    const name =
        getField(data, ["Name", "Full Name"]) || "Member";

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
                <div class="dynamic-question">
                    ${escapeHTML(label)}
                </div>
                <div class="dynamic-answer">
                    ${escapeHTML(value)}
                </div>
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
                               <img
                                   src="${escapeAttribute(photoURL)}"
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
        return (
            "https://drive.google.com/thumbnail?id=" +
            encodeURIComponent(match[1]) +
            "&sz=w800"
        );
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
