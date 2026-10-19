const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

const PARTICLE_COUNT = 35;
const MAX_LINK_DIST = 160;
const DOT_RADIUS = 2.2;
const SPEED = 0.15;

const DOT_COLOR = "rgba(56, 189, 248, 1)";
const LINE_COLOR = "rgba(180, 210, 255, 0.5)";

let particles = [];

function initParticles() {

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

initParticles();


function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // -----------------------------
    // MOVE PARTICLES
    // -----------------------------

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


    // -----------------------------
    // DRAW NETWORK
    // -----------------------------

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

                // Closer = brighter
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


    // -----------------------------
    // DRAW PARTICLES
    // -----------------------------

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

animate();
// ============================================================
// MEMBER DIRECTORY - app.js
// FINAL VERSION
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

        <!-- =====================================
             LEFT SIDE
        ====================================== -->

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


            <!-- BUTTONS -->

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



        <!-- =====================================
             RIGHT SIDE
        ====================================== -->

        <div class="featured-right">


            <!-- NAME -->

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


            <!-- =================================
                 ABOUT
            ================================== -->

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


            <!-- =================================
                 RESEARCH
            ================================== -->

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


            <!-- =================================
                 EDUCATION
            ================================== -->

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


    const name =
        data["Full Name"] ||
        data["Name"] ||
        "Member";


    const role =
        data["Role"] ||
        data["Position"] ||
        data["Designation"] ||
        data["Job Title"] ||
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
        "";


    const email =
        data["Email"] ||
        "";


    // ========================================================
    // PHOTO
    // ========================================================

    const image =
        data["Photo"] ||
        data["Profile Photo"] ||
        data["Image"] ||
        data["Photo URL"] ||
        data["Profile Image"] ||
        "";


    /*
       If there is no image in the response,
       use a simple placeholder.
    */

    const profileImage =
        image ||
        "https://via.placeholder.com/500x500.png?text=Profile";


    // ========================================================
    // CARD HTML
    // ========================================================

    card.innerHTML = `


        <!-- =================================================
             LEFT SIDE
        ================================================== -->

        <div class="member-left">


            <!-- PHOTO -->

            <div class="member-image-container">

                <img
                    src="${escapeAttribute(
                        profileImage
                    )}"
                    alt="${escapeAttribute(
                        name
                    )}"
                    class="member-image"
                >

            </div>


            <!-- BUTTONS -->

            <div class="member-buttons">


                ${
                    linkedin
                    ?
                    `
                    <a
                        href="${escapeAttribute(
                            linkedin
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



        <!-- =================================================
             RIGHT SIDE
        ================================================== -->

        <div class="member-right">


            <!-- =================================================
                 NAME / ROLE / ORGANIZATION
            ================================================== -->

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



            <!-- =================================================
                 ABOUT
            ================================================== -->

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



            <!-- =================================================
                 RESEARCH
            ================================================== -->

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



            <!-- =================================================
                 EDUCATION
            ================================================== -->

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



            <!-- =================================================
                 EXPERIENCE
            ================================================== -->

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
        // IMPORTANT
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