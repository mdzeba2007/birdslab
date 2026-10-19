const RESEARCH_API =
    "https://script.google.com/macros/s/AKfycbzqreM83L-FZsfg-AhBgbw05HD6Vb-7EYSnnu3cDpFl853P8yorJQXjsAlGWwlgh9-o/exec";

let researchData = [];


/* =========================================================
   LOAD RESEARCH FROM GOOGLE SHEET
========================================================= */

async function loadResearch() {

    const researchGrid =
        document.getElementById("researchGrid");

    if (!researchGrid) {
        console.error("researchGrid not found.");
        return;
    }

    try {

        researchGrid.innerHTML = `
            <p style="
                text-align:center;
                color:#555;
                font-size:18px;
                grid-column:1/-1;
            ">
                Loading research...
            </p>
        `;


        const response = await fetch(
            RESEARCH_API + "?t=" + Date.now()
        );


        if (!response.ok) {
            throw new Error("Failed to fetch research data.");
        }


        const data = await response.json();


        researchData =
            (data.research || []).filter(function (item) {

                return String(item.Status || "")
                    .trim()
                    .toLowerCase() === "active";

            });


        renderResearch();


    } catch (error) {

        console.error("RESEARCH LOAD ERROR:", error);

        researchGrid.innerHTML = `
            <p style="
                text-align:center;
                color:red;
                font-size:18px;
                grid-column:1/-1;
            ">
                Unable to load research.
            </p>
        `;
    }
}



/* =========================================================
   RENDER ALL RESEARCH CARDS
========================================================= */

function renderResearch() {

    const researchGrid =
        document.getElementById("researchGrid");

    if (!researchGrid) return;


    researchGrid.innerHTML = "";


    if (researchData.length === 0) {

        researchGrid.innerHTML = `
            <p style="
                text-align:center;
                color:#555;
                grid-column:1/-1;
            ">
                No research available.
            </p>
        `;

        return;
    }


    researchData.forEach(function (item) {

        const card =
            createResearchCard(item);

        researchGrid.appendChild(card);

    });
}



/* =========================================================
   CREATE ONE RESEARCH CARD
========================================================= */

function createResearchCard(item) {

    /* CARD */

    const card =
        document.createElement("div");

    card.className = "research-card";


    /* =====================================================
       IMAGE
    ===================================================== */

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "research-image";


    const image =
        document.createElement("img");


    image.src =
        String(item.Image || "").trim();


    image.alt =
        item.Title || "Research";


    image.onerror = function () {

        console.warn(
            "Image could not be loaded:",
            image.src
        );

    };


    imageContainer.appendChild(image);



    /* =====================================================
       CONTENT
    ===================================================== */

    const content =
        document.createElement("div");

    content.className =
        "research-content";



    /* =====================================================
       TITLE
    ===================================================== */

    const title =
        document.createElement("h3");

    title.textContent =
        item.Title || "Untitled Research";



    /* =====================================================
       SHORT DESCRIPTION
    ===================================================== */

    const description =
        document.createElement("p");

    description.textContent =
        item.Description || "";



    /* =====================================================
       MORE CONTENT

       IMPORTANT:
       This MUST be "more-content"
       because your CSS uses:

       .more-content
       .more-content.active
    ===================================================== */

    const moreContent =
        document.createElement("div");

    moreContent.className =
        "more-content";


    const moreParagraph =
        document.createElement("p");

    moreParagraph.textContent =
        item.Details || "";


    moreContent.appendChild(
        moreParagraph
    );



    /* =====================================================
       SHOW MORE / SHOW LESS BUTTON
    ===================================================== */

    const button =
        document.createElement("button");

    button.className =
        "show-more";

    button.type =
        "button";

    button.textContent =
        "Show More";



    /* =====================================================
       BUTTON CLICK
    ===================================================== */

    button.addEventListener(
        "click",
        function () {

            moreContent.classList.toggle("active");


            if (
                moreContent.classList.contains("active")
            ) {

                button.textContent =
                    "Show Less";

            } else {

                button.textContent =
                    "Show More";

            }

        }
    );



    /* =====================================================
       ADD EVERYTHING TO CONTENT
    ===================================================== */

    content.appendChild(title);

    content.appendChild(description);

    content.appendChild(moreContent);

    content.appendChild(button);



    /* =====================================================
       ADD CONTENT TO CARD
    ===================================================== */

    card.appendChild(imageContainer);

    card.appendChild(content);


    return card;
}



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadResearch();

    }
);