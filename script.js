
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

if (canvas && ctx) {
    resize();
    window.addEventListener("resize", resize);
}

const PARTICLE_COUNT = 35;
const MAX_LINK_DIST = 160;
const DOT_RADIUS = 2.2;
const SPEED = 0.15;

const DOT_COLOR = "rgba(56, 189, 248, 1)";
const LINE_COLOR = "rgba(180, 210, 255, 0.5)";

let particles = [];

function initParticles() {
    if (!canvas) return;

    particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED
        });
    }
}

if (canvas && ctx) {
    initParticles();
}

function animate() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) {
            p.vx *= -1;
        }

        if (p.y < 0 || p.y > canvas.height) {
            p.vy *= -1;
        }
    }

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (distance < MAX_LINK_DIST) {
                const opacity =
                    1 - distance / MAX_LINK_DIST;

                ctx.strokeStyle =
                    `rgba(180, 210, 255, ${opacity})`;

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
    }

    ctx.fillStyle = DOT_COLOR;

    for (const p of particles) {
        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            DOT_RADIUS,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    requestAnimationFrame(animate);
}

if (canvas && ctx) {
    animate();
}


// ============================================================
// MEMBER DIRECTORY - app.js
// ============================================================


// ============================================================
// GOOGLE APPS SCRIPT URL
// ============================================================

const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbz89GhOCt2J-EJ59n29JTttKq0IB7t2weWpC0rjxGULq8NtLp8zecN3nlm05LCQXKa_pg/exec";


// ============================================================
// MAIN PROFILE CONTAINER
// ============================================================

const profiles =
    document.getElementById("profiles");


// ============================================================
// DR. BHIVRAJ SUTHAR
// ============================================================

const bhivrajProfile = {

    name:
        "Dr. Bhivraj Suthar",

    role:
        "Professor",

    organization:
        "IIT Jodhpur",

    image:
        "Bhivrajsuthar.png",

    about:
        "Currently at IIT Jodhpur. Specializes in Bio-inspired Robotics and Applied Artificial Intelligence. Completed PhD from KOREATECH and KAIST, South Korea.",

    research:
        "Bio-inspired Robotics and Applied Artificial Intelligence",

    education:
        "Ph.D. from KOREATECH and KAIST, South Korea (2016 - 2020)",

    linkedin:
        "https://www.linkedin.com/in/bhivraj-s-823528294",

    email:
        "bhivraj@iitj.ac.in"

};


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value = "") {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// ============================================================
// ESCAPE ATTRIBUTE
// ============================================================

function escapeAttribute(value = "") {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll('"', "&quot;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;");

}


// ============================================================
// DISPLAY DR. BHIVRAJ PROFILE
// ============================================================

function displayBhivrajProfile() {

    if (!profiles) {
        return;
    }

    const card =
        document.createElement("div");

    card.className =
        "featured-profile";

    card.innerHTML = `

        <div class="featured-left">

            <div class="profile-image-container">

                <img
                    src="${escapeAttribute(
                        bhivrajProfile.image
                    )}"
                    alt="Dr. Bhivraj Suthar"
                    class="featured-image"
                >

            </div>

            <div class="profile-buttons">

                ${
                    bhivrajProfile.linkedin
                    ?
                    `
                    <a
                        href="${escapeAttribute(
                            bhivrajProfile.linkedin
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="linkedin-button"
                    >

                        <span>in</span>

                        LinkedIn

                    </a>
                    `
                    :
                    ""
                }

                ${
                    bhivrajProfile.email
                    ?
                    `
                    <a
                        href="mailto:${escapeAttribute(
                            bhivrajProfile.email
                        )}"
                        class="email-button"
                    >

                        ✉ Email

                    </a>
                    `
                    :
                    ""
                }

            </div>

        </div>

        <div class="featured-right">

            <div class="profile-heading">

                <h2>
                    ${escapeHTML(
                        bhivrajProfile.name
                    )}
                </h2>

                <p class="profile-role">

                    ${escapeHTML(
                        bhivrajProfile.role
                    )}

                </p>

                <p class="profile-organization">

                    ${escapeHTML(
                        bhivrajProfile.organization
                    )}

                </p>

            </div>

            <div class="profile-divider"></div>

            <div class="profile-section">

                <h3>
                    About
                </h3>

                <p>

                    ${escapeHTML(
                        bhivrajProfile.about
                    )}

                </p>

            </div>

            <div class="profile-section">

                <h3>
                    Research Interests
                </h3>

                <span class="research-pill">

                    ${escapeHTML(
                        bhivrajProfile.research
                    )}

                </span>

            </div>

            <div class="profile-section">

                <h3>
                    Education
                </h3>

                <div class="education-box">

                    <strong>
                        PhD
                    </strong>

                    <span>

                        ${escapeHTML(
                            bhivrajProfile.education
                        )}

                    </span>

                </div>

            </div>

        </div>

    `;

    profiles.appendChild(card);

}


// ============================================================
// CONVERT GOOGLE DRIVE LINKS INTO IMAGE URLS
// ============================================================


// ============================================================
// CREATE MEMBER CARD
// ============================================================

function createMemberCard(data) {

    const card =
        document.createElement("div");

    card.className =
        "member-card";


    // ========================================================
    // GET DATA FROM GOOGLE SHEET
    // ========================================================

function getDirectImageUrl(url) {

    if (!url) {
        return "";
    }

    url = String(url).trim();

    // Extract URL from a Google Sheets Markdown link.
    const markdownUrl = url.match(/https?:\/\/[^\s)]+/);

    if (markdownUrl) {
        url = markdownUrl[0];
    }

    // Clean escaped characters.
    url = url
        .replaceAll("&amp;", "&")
        .replace(/\\&/g, "&");

    // Extract Google Drive file ID.
    const match = url.match(
        /(?:[?&]id=|\/file\/d\/)([a-zA-Z0-9_-]+)/
    );

    if (match && match[1]) {

        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;

    }

    return url;
}


    const name =
        data["Full Name"] ||
        data["Name"] ||
        "Member";


    const role =
        data["Role"] ||
        data["Position"] ||
        data["Designation"] ||
        data["Job Title"] ||
        data["Current role"] ||
        "";


    const organization =
        data["Organization"] ||
        data["Institution"] ||
        data["Institute"] ||
        data["College"] ||
        "";


    const about =
        data["About"] ||
        data["About Me"] ||
        data["Bio"] ||
        data["Description"] ||
        "";


    const research =
        data["Research"] ||
        data["Research / Interests"] ||
        data["Research Interests"] ||
        data["Research (Currently working on or did in the past)"] ||
        "";


    const education =
        data["Education"] ||
        "";


    const experience =
        data["Experience"] ||
        "";


    const linkedin =
        data["LinkedIn"] ||
        data["LinkedIn Profile"] ||
        data["Linkedin profile(URL LINK)"] ||
        "";


    const email =
        data["Email"] ||
        data["Email ID(Institute)"] ||
        "";


    // ========================================================
    // PHOTO
    // ========================================================

    const image =
        data["Upload your current photo"] ||
        data["Photo"] ||
        data["Profile Photo"] ||
        data["Image"] ||
        data["Photo URL"] ||
        data["Profile Image"] ||
        "";


    const profileImage =
        image
            ? getDirectImageUrl(image)
            : "https://via.placeholder.com/500x500.png?text=Profile";


    console.log("Profile image URL for", name, ":", profileImage);


    // ========================================================
    // CARD HTML
    // ========================================================

    card.innerHTML = `

        <div class="member-left">

            <div class="member-image-container">

<img
    src="${escapeAttribute(profileImage)}"
    alt="${escapeAttribute(name)}"
    class="member-photo"
    onerror="console.error('Profile image failed:', this.src);"
>


            </div>

            <div class="member-buttons">

                ${
                    linkedin
                    ?
                    `
                    <a
                        href="${escapeAttribute(
                            linkedin.startsWith("http")
                                ? linkedin
                                : "https://" + linkedin
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="member-linkedin"
                    >

                        <span>
                            in
                        </span>

                        LinkedIn

                    </a>
                    `
                    :
                    ""
                }

                ${
                    email
                    ?
                    `
                    <a
                        href="mailto:${escapeAttribute(
                            email
                        )}"
                        class="member-email"
                    >

                        ✉ Email

                    </a>
                    `
                    :
                    ""
                }

            </div>

        </div>


        <div class="member-right">

            <div class="member-heading">

                <h2>

                    ${escapeHTML(
                        name
                    )}

                </h2>

                ${
                    role
                    ?
                    `
                    <p class="member-role">

                        ${escapeHTML(
                            role
                        )}

                    </p>
                    `
                    :
                    ""
                }

                ${
                    organization
                    ?
                    `
                    <p class="member-organization">

                        ${escapeHTML(
                            organization
                        )}

                    </p>
                    `
                    :
                    ""
                }

            </div>

            <div class="member-divider"></div>


            ${
                about
                ?
                `
                <div class="member-section">

                    <h3>
                        About
                    </h3>

                    <p>

                        ${escapeHTML(
                            about
                        )}

                    </p>

                </div>
                `
                :
                ""
            }


            ${
                research
                ?
                `
                <div class="member-section">

                    <h3>
                        Research Interests
                    </h3>

                    <span class="member-research-pill">

                        ${escapeHTML(
                            research
                        )}

                    </span>

                </div>
                `
                :
                ""
            }


            ${
                education
                ?
                `
                <div class="member-section">

                    <h3>
                        Education
                    </h3>

                    <div class="member-education-box">

                        <strong>
                            Education
                        </strong>

                        <span>

                            ${escapeHTML(
                                education
                            )}

                        </span>

                    </div>

                </div>
                `
                :
                ""
            }


            ${
                experience
                ?
                `
                <div class="member-section">

                    <h3>
                        Experience
                    </h3>

                    <p>

                        ${escapeHTML(
                            experience
                        )}

                    </p>

                </div>
                `
                :
                ""
            }

        </div>

    `;

    return card;

}


// ============================================================
// LOAD APPROVED GOOGLE FORM PROFILES
// ============================================================

async function loadGoogleProfiles() {

    const otherMembers =
        document.getElementById(
            "otherMembers"
        );


    if (!otherMembers) {

        console.error(
            "Element #otherMembers was not found."
        );

        return;

    }


    // ========================================================
    // LOADING MESSAGE
    // ========================================================

    otherMembers.innerHTML = `

        <div class="no-members">

            Loading approved members...

        </div>

    `;


    try {

        // ====================================================
        // ONLY APPROVED PROFILES
        // ====================================================

        const response =
            await fetch(
                GOOGLE_SHEET_API +
                "?type=approved"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to fetch profiles."
            );

        }


        const submittedProfiles =
            await response.json();


        console.log(
            "Approved profiles:",
            submittedProfiles
        );


        // ====================================================
        // CLEAR OLD CONTENT
        // ====================================================

        otherMembers.innerHTML = "";


        // ====================================================
        // NO APPROVED PROFILES
        // ====================================================

        if (
            !Array.isArray(
                submittedProfiles
            ) ||
            submittedProfiles.length === 0
        ) {

            otherMembers.innerHTML = `

                <div class="no-members">

                    No approved members yet.

                </div>

            `;

            return;

        }


        // ====================================================
        // CREATE CARDS
        // ====================================================

        submittedProfiles.forEach(
            (profile) => {

                const card =
                    createMemberCard(
                        profile
                    );

                otherMembers.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading approved profiles:",
            error
        );

        otherMembers.innerHTML = `

            <div class="no-members">

                Unable to load approved profiles.

            </div>

        `;

    }

}


// ============================================================
// INITIALIZE PAGE
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            displayBhivrajProfile();

            loadGoogleProfiles();

        }
    );

}

else {

    displayBhivrajProfile();

    loadGoogleProfiles();

}
