/* =========================================================
   NEXT BUTTON
========================================================= */

const nextButton =
    document.getElementById("nextButton");

const welcomeSection =
    document.querySelector(".welcome-section");


if (nextButton && welcomeSection) {

    nextButton.addEventListener(
        "click",
        function () {

            welcomeSection.scrollIntoView({
                behavior: "smooth"
            });

        }
    );

}


/* =========================================================
   SCROLL ANIMATION
========================================================= */

const sections =
    document.querySelectorAll(
        ".left-column, .right-column"
    );


const observer =
    new IntersectionObserver(

        (entries) => {

            entries.forEach(
                (entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "show"
                        );

                    }

                }
            );

        },

        {
            threshold: 0.15
        }

    );


sections.forEach(
    (section) => {

        observer.observe(section);

    }
);


/* =========================================================
   GOOGLE SHEET - HOME PAGE
========================================================= */

const HOME_API =
    "https://script.google.com/macros/s/AKfycby5catpPO3w71ihmpHQwSufz9gzQAg8yVh7IHJE1nKUhNcxQsFmcAUtywo_3rIoU2n0/exec";


/* =========================================================
   LOAD HOME CONTENT
========================================================= */

async function loadHomeContent() {

    try {

        const response =
            await fetch(
                HOME_API +
                "?t=" +
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load home content."
            );

        }


        const data =
            await response.json();


        const content =
            data.content || {};


        console.log(
            "HOME SHEET DATA:",
            content
        );


        applyHomeContent(
            content
        );


    } catch (error) {

        console.error(
            "HOME CONTENT ERROR:",
            error
        );

    }

}


/* =========================================================
   APPLY GOOGLE SHEET CONTENT
========================================================= */

function applyHomeContent(content) {


    /* =====================================================
       HERO
    ===================================================== */

    setText(
        "hero-welcome",
        content.hero_welcome
    );


    /*
       IMPORTANT:
       hero-title uses HTML because the Google Sheet
       contains <br> for line breaks.
    */

    setHTML(
        "hero-title",
        content.hero_title
    );


    setText(
        "hero-description",
        content.hero_description
    );


    setText(
        "hero-button",
        content.hero_button
    );


    setLink(
        "hero-button",
        content.hero_button_link
    );


    /* =====================================================
       HERO VIDEO
    ===================================================== */

    const video =
        document.querySelector(
            ".background-video"
        );


    if (
        video &&
        content.hero_video
    ) {

        const source =
            video.querySelector(
                "source"
            );


        if (source) {

            source.src =
                content.hero_video;

            video.load();

        }

    }


    /* =====================================================
       WELCOME SECTION
    ===================================================== */

    setText(
        "welcome-small-title",
        content.welcome_small_title
    );


    setHTML(
        "welcome-title",
        content.welcome_title
    );


    setText(
        "welcome-description",
        content.welcome_description
    );


    /* =====================================================
       ABOUT US
    ===================================================== */

    setText(
        "about-small-title",
        content.about_small_title
    );


    setHTML(
        "about-title",
        content.about_title
    );


    setText(
        "about-text-1",
        content.about_text_1
    );


    setText(
        "about-text-2",
        content.about_text_2
    );


    /* =====================================================
       VISION
    ===================================================== */

    setText(
        "vision-number",
        content.vision_number
    );


    setText(
        "vision-title",
        content.vision_title
    );


    setText(
        "vision-text",
        content.vision_text
    );


    /* =====================================================
       MISSION
    ===================================================== */

    setText(
        "mission-number",
        content.mission_number
    );


    setText(
        "mission-title",
        content.mission_title
    );


    setText(
        "mission-text",
        content.mission_text
    );


    /* =====================================================
       GOAL
    ===================================================== */

    setText(
        "goal-number",
        content.goal_number
    );


    setText(
        "goal-title",
        content.goal_title
    );


    setText(
        "goal-text",
        content.goal_text
    );


    /* =====================================================
       RESEARCH SECTION
    ===================================================== */

    setText(
        "research-small-title",
        content.research_small_title
    );


    setHTML(
        "research-title",
        content.research_title
    );


    setText(
        "research-description",
        content.research_description
    );


    /* =====================================================
       RESEARCH IMAGES
    ===================================================== */

    setImage(
        "research-image-1",
        content.research_image_1
    );


    setImage(
        "research-image-2",
        content.research_image_2
    );


    setImage(
        "research-image-3",
        content.research_image_3
    );


    setImage(
        "research-image-4",
        content.research_image_4
    );


    setImage(
        "research-image-5",
        content.research_image_5
    );


    setImage(
        "research-image-6",
        content.research_image_6
    );


    /* =====================================================
       RESEARCH CARD 1
    ===================================================== */

    setText(
        "research-card-1-icon",
        content.research_card_1_icon
    );


    setText(
        "research-card-1-title",
        content.research_card_1_title
    );


    setText(
        "research-card-1-text",
        content.research_card_1_text
    );


    setText(
        "research-card-1-button",
        content.research_card_1_button
    );


    setLink(
        "research-card-1-button",
        content.research_card_1_link
    );


    /* =====================================================
       RESEARCH CARD 2
    ===================================================== */

    setText(
        "research-card-2-icon",
        content.research_card_2_icon
    );


    setText(
        "research-card-2-title",
        content.research_card_2_title
    );


    setText(
        "research-card-2-text",
        content.research_card_2_text
    );


    /* =====================================================
       RESEARCH CARD 3
    ===================================================== */

    setText(
        "research-card-3-icon",
        content.research_card_3_icon
    );


    setText(
        "research-card-3-title",
        content.research_card_3_title
    );


    setText(
        "research-card-3-text",
        content.research_card_3_text
    );


    /* =====================================================
       FOOTER
    ===================================================== */

    setText(
        "footer-title",
        content.footer_title
    );


    setText(
        "footer-lab",
        content.footer_lab
    );


    setText(
        "footer-description",
        content.footer_description
    );


    setText(
        "footer-git",
        content.footer_git_text
    );


    setLink(
        "footer-git",
        content.footer_git_link
    );


    setText(
        "footer-contact-title",
        content.footer_contact_title
    );


    setText(
        "footer-address",
        content.footer_address
    );


    setText(
        "footer-email",
        content.footer_email
    );


    setText(
        "footer-phone",
        content.footer_phone
    );


    /* =====================================================
       NAVBAR
    ===================================================== */

    setNav(
        "nav-home",
        content.nav_home_text,
        content.nav_home_link
    );


    setNav(
        "nav-people",
        content.nav_people_text,
        content.nav_people_link
    );


    setNav(
        "nav-research",
        content.nav_research_text,
        content.nav_research_link
    );


    setNav(
        "nav-publications",
        content.nav_publications_text,
        content.nav_publications_link
    );


    setNav(
        "nav-lectures",
        content.nav_lectures_text,
        content.nav_lectures_link
    );


    setNav(
        "nav-collaboration",
        content.nav_collaboration_text,
        content.nav_collaboration_link
    );


    setNav(
        "nav-facilities",
        content.nav_facilities_text,
        content.nav_facilities_link
    );


    setNav(
        "nav-positions",
        content.nav_positions_text,
        content.nav_positions_link
    );


    setNav(
        "nav-events",
        content.nav_events_text,
        content.nav_events_link
    );


    setNav(
        "nav-calendar",
        content.nav_calendar_text,
        content.nav_calendar_link
    );


    /* =====================================================
       SOCIAL LINKS
    ===================================================== */

    setLink(
        "social-x",
        content.social_x_link
    );


    setLink(
        "social-linkedin",
        content.social_linkedin_link
    );


    setLink(
        "social-github",
        content.social_github_link
    );


    setLink(
        "social-youtube",
        content.social_youtube_link
    );

}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */


/* ---------------------------------------------------------
   NORMAL TEXT
--------------------------------------------------------- */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (
        element &&
        value !== undefined &&
        value !== null
    ) {

        element.textContent =
            value;

    }

}


/* ---------------------------------------------------------
   HTML CONTENT
   Used for <br> line breaks
--------------------------------------------------------- */

function setHTML(id, value) {

    const element =
        document.getElementById(id);


    if (
        element &&
        value !== undefined &&
        value !== null
    ) {

        element.innerHTML =
            value;

    }

}


/* ---------------------------------------------------------
   LINKS
--------------------------------------------------------- */

function setLink(id, value) {

    const element =
        document.getElementById(id);


    if (
        element &&
        value !== undefined &&
        value !== null
    ) {

        element.href =
            value || "#";

    }

}


/* ---------------------------------------------------------
   IMAGES
--------------------------------------------------------- */

function setImage(id, value) {

    const element =
        document.getElementById(id);


    if (
        element &&
        value
    ) {

        element.src =
            value;

    }

}


/* ---------------------------------------------------------
   NAVBAR
--------------------------------------------------------- */

function setNav(id, text, link) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (
        text !== undefined &&
        text !== null
    ) {

        element.textContent =
            text;

    }


    if (
        link !== undefined &&
        link !== null
    ) {

        element.href =
            link || "#";

    }

}


/* =========================================================
   START GOOGLE SHEET LOADING
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadHomeContent();

    }
);