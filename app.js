
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
            imageElement.src = convertDriveURL(photo);
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


    const photoURL = convertDriveURL(photo);


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
                                >

                            </div>
                        `

                        : `
                            <div class="member-photo-placeholder">
                                Photo not available
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
// GOOGLE DRIVE PHOTO URL CONVERSION
// =========================================================

function convertDriveURL(url) {

    if (!url) return "";

    url = String(url).trim();


    const match =

        url.match(
            /drive\.google\.com\/file\/d\/([^/?]+)/i
        )

        ||

        url.match(
            /drive\.google\.com\/open\?id=([^&]+)/i
        )

        ||

        url.match(
            /drive\.google\.com\/thumbnail\?id=([^&]+)/i
        );


    if (match) {

        return (
            "https://drive.google.com/thumbnail?id=" +
            encodeURIComponent(match[1]) +
            "&sz=w800"
        );

    }


    return url;

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
