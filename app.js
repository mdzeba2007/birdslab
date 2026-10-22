
const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbx5XnFAMF0Sp0M5SXYA1v3RPFGt4XyJgwneAQFSXG2d_93pNRWWhxWs5zH00VA7ewTmpA/exec";

const FEATURED_PROFILE_API = "https://script.google.com/macros/s/AKfycbwh4xozTzLUqwshZFRgIgFmPSUdPFORKv6A_TID9G9Akkbt4KC_AHWgzEY6K1v9g0uw/exec";
// ========================================
// GET FIELD
// ========================================

function getField(data, possibleNames) {
    if (!data || typeof data !== "object") return "";

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
// FEATURED PROFESSOR: SEPARATE GOOGLE SHEET
// ========================================


async function loadFeaturedProfileFromSheet() {
    try {
        const response = await fetch(
            FEATURED_PROFILE_API + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Could not load featured profile: " + response.status);
        }

        const profile = await response.json();

        console.log("Data received from sheet:", profile);

        if (profile.success === false) {
            throw new Error(profile.error || "Featured profile API error");
        }

        const fields = {
            featuredName: ["Name"],
            featuredRole: ["Current Role"],
            featuredOrganization: ["Affiliation"],
            featuredAbout: ["About"],
            featuredResearch: ["Research Interests"],
            featuredEducation: ["Education"]
        };

        Object.entries(fields).forEach(([id, keys]) => {
            const element = document.getElementById(id);
            const value = getField(profile, keys);

            console.log(id, {
                elementFound: !!element,
                valueReceived: value
            });

            if (element && value) {
                element.textContent = value;
            }
        });

        const degree = getField(profile, ["Education Degree"]);
        const degreeElement = document.getElementById("featuredEducationDegree");

        if (degreeElement && degree) {
            degreeElement.textContent = degree;
        }

        const photo = getField(profile, ["Photo URL", "photo url"]);
        const imageElement = document.getElementById("featuredImage");

        if (imageElement && photo) {
            imageElement.src = convertDriveURL(photo);
        }

        const email = getField(profile, ["Email", "Email ID"]);
        const emailLink = document.getElementById("featuredEmail");

        if (emailLink && email) {
            emailLink.href = "mailto:" + email;
        }

        const linkedin = getField(profile, ["LinkedIn", "LinkedIn Profile"]);
        const linkedinLink = document.getElementById("featuredLinkedin");

        if (linkedinLink && linkedin) {
            if (/^https?:\/\//i.test(linkedin)) {
                linkedinLink.href = linkedin;
            }
        }

        console.log("Featured profile update completed.");

    } catch (error) {
        console.error("Error loading featured profile:", error);
    }
}


// ========================================
// IDENTIFY DR. BHIVRAJ IN THE OLD SHEET
// ========================================

function isBhivrajProfile(profile) {
    const name = getField(profile, ["Name", "Full Name"])
        .toLowerCase()
        .replace(/^dr\.?\s*/, "")
        .trim();

    return name === "bhivraj suthar";
}

// ========================================
// EDUCATION CATEGORY MAPPING
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
// LOAD MEMBERS FROM ORIGINAL GOOGLE SHEET
// ========================================

async function loadGoogleProfiles() {
    const categoryNames = {
        postDoctoralMembers: "Post-Doctoral Fellows / Scientists",
        phdMembers: "PhD Scholars",
        projectStaffMembers: "Project Staff",
        masterMembers: "Master Students",
        bachelorMembers: "Bachelor Students",
        otherMembers: "Other Members"
    };

    const containers = {};

    Object.entries(categoryNames).forEach(([id]) => {
        containers[id] = document.getElementById(id);
    });

    if (!containers.otherMembers) {
        console.error("Member containers not found in people.html.");
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
            throw new Error("Could not connect to member Google Sheet");
        }

        const result = await response.json();
        console.log("Member Google Sheets response:", result);

        let profiles = [];

        if (Array.isArray(result)) {
            profiles = result;
        } else if (Array.isArray(result.profiles)) {
            profiles = result.profiles;
        } else if (result.success === false) {
            throw new Error(
                result.error || result.message || "Member API error"
            );
        }

        // Display only approved profiles, preserving the
        // behavior of the existing member directory.
        profiles = profiles.filter(profile => {
            const status = getField(profile, ["Status"]);
            return !status || status.toLowerCase() === "approved";
        });

        // The professor's featured card is loaded from the new sheet.
        // Do not create a duplicate card from the old sheet.
        profiles = profiles.filter(
            profile => !isBhivrajProfile(profile)
        );

        Object.values(containers).forEach(container => {
            if (container) container.innerHTML = "";
        });

        const counts = {};

        Object.keys(categoryNames).forEach(id => {
            counts[id] = 0;
        });

        profiles.forEach(profile => {
            const education = getField(profile, ["Education"]);
            const categoryId = getCategory(education);

            let container = containers[categoryId];

            if (!container) {
                container = containers.otherMembers;
                counts.otherMembers++;
            } else {
                counts[categoryId]++;
            }

            container.appendChild(createMemberCard(profile));
        });

        // Show a message for each empty category.
        Object.entries(containers).forEach(([id, container]) => {
            if (container && counts[id] === 0) {
                container.innerHTML = `
                    <div class="no-members">
                        No members in ${categoryNames[id]} yet.
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("Error loading member profiles:", error);

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
// CREATE MEMBER CARD
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
        const validLinkedin = /^https?:\/\//i.test(linkedin);

        detailsHTML += `
            <div class="dynamic-detail">
                <div class="dynamic-question">LinkedIn Profile</div>
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
// START BOTH LOADERS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedProfileFromSheet();
    loadGoogleProfiles();
});
