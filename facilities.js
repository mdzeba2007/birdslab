/* =========================================================
   BIRDLAB EQUIPMENT
   GOOGLE SHEET API
========================================================= */

const EQUIPMENT_API =
    "https://script.google.com/macros/s/AKfycbwYx1K6qyxTemVdePl8PeKiuS-tgHIoqEyTFxOGFoi67SbEP2BXk5GtwhmDgcwSb8p7/exec";


/* =========================================================
   MACHINE DATA
   Loaded from Google Sheet
========================================================= */

let machines = [];


/* =========================================================
   LOAD EQUIPMENT FROM GOOGLE SHEET
========================================================= */

async function loadEquipment() {

    const machineGrid =
        document.getElementById("machineGrid");

    if (!machineGrid) {

        console.error(
            "machineGrid not found in HTML."
        );

        return;
    }


    try {

        const response =
            await fetch(
                EQUIPMENT_API + "?t=" + Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch equipment data."
            );

        }


        const result =
            await response.json();


        console.log(
            "Equipment data:",
            result
        );


        machines =
            result.equipment || [];


        /* =================================================
           ONLY SHOW ACTIVE EQUIPMENT
        ================================================= */

        machines =
            machines.filter(function (machine) {

                return String(
                    machine.Status || ""
                )
                    .trim()
                    .toLowerCase() === "active";

            });


        /* =================================================
           CLEAR OLD CARDS
        ================================================= */

        machineGrid.innerHTML = "";


        /* =================================================
           CREATE CARDS
        ================================================= */

        machines.forEach(
            function (machine, index) {

                createMachineCard(
                    machine,
                    index
                );

            }
        );


        console.log(
            machines.length +
            " equipment cards loaded."
        );


    } catch (error) {

        console.error(
            "Error loading equipment:",
            error
        );


        machineGrid.innerHTML = `

            <p style="
                text-align:center;
                width:100%;
                padding:40px;
                color:#777;
            ">

                Unable to load laboratory equipment.

            </p>

        `;

    }

}


/* =========================================================
   CREATE MACHINE CARD
========================================================= */

function createMachineCard(
    machine,
    index
) {

    const machineGrid =
        document.getElementById(
            "machineGrid"
        );


    /* =====================================================
       MACHINE CARD
    ===================================================== */

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "machine-card";


    /* =====================================================
       IMAGE CONTAINER

       IMPORTANT:
       This uses your existing .machine-image CSS,
       including the 260px image height.
    ===================================================== */

    const imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "machine-image";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        machine.Image || "";


    image.alt =
        machine.Name ||
        "Laboratory Equipment";


    imageContainer.appendChild(
        image
    );


    /* =====================================================
       MACHINE CONTENT
    ===================================================== */

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "machine-content";


    /* =====================================================
       MACHINE NAME
    ===================================================== */

    const name =
        document.createElement(
            "h2"
        );


    name.textContent =
        machine.Name ||
        "Unnamed Equipment";


    /* =====================================================
       CATEGORY
    ===================================================== */

    const category =
        document.createElement(
            "span"
        );


    category.className =
        "category";


    category.textContent =
        machine.Category || "";


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        machine.Description || "";


    /* =====================================================
       SHOW MORE BUTTON
    ===================================================== */

    const button =
        document.createElement(
            "button"
        );


    button.className =
        "show-more";


    button.textContent =
        "Show More";


    button.addEventListener(
        "click",
        function () {

            toggleDetails(index);

        }
    );


    /* =====================================================
       ADD CONTENT TO CONTENT CONTAINER
    ===================================================== */

    content.appendChild(
        name
    );


    content.appendChild(
        category
    );


    content.appendChild(
        description
    );


    content.appendChild(
        button
    );


    /* =====================================================
       ADD IMAGE + CONTENT TO CARD
    ===================================================== */

    card.appendChild(
        imageContainer
    );


    card.appendChild(
        content
    );


    /* =====================================================
       ADD CARD TO GRID
    ===================================================== */

    machineGrid.appendChild(
        card
    );

}


/* =========================================================
   SHOW MACHINE DETAILS
========================================================= */

function toggleDetails(index) {

    /* =====================================================
       CHECK MACHINE
    ===================================================== */

    if (!machines[index]) {

        console.error(
            "Machine not found:",
            index
        );

        return;
    }


    /* =====================================================
       GET MACHINE
    ===================================================== */

    const machine =
        machines[index];


    /* =====================================================
       GET MODAL ELEMENTS
    ===================================================== */

    const overlay =
        document.getElementById(
            "detailsOverlay"
        );


    const detailImage =
        document.getElementById(
            "detailImage"
        );


    const detailName =
        document.getElementById(
            "detailName"
        );


    const detailCategory =
        document.getElementById(
            "detailCategory"
        );


    const specifications =
        document.getElementById(
            "specifications"
        );


    /* =====================================================
       CHECK MODAL
    ===================================================== */

    if (
        !overlay ||
        !detailImage ||
        !detailName ||
        !detailCategory ||
        !specifications
    ) {

        console.error(
            "Details modal elements are missing from HTML."
        );

        return;
    }


    /* =====================================================
       SET IMAGE
    ===================================================== */

    detailImage.src =
        machine.Image || "";


    detailImage.alt =
        machine.Name ||
        "Equipment";


    /* =====================================================
       SET NAME
    ===================================================== */

    detailName.textContent =
        machine.Name || "";


    /* =====================================================
       SET CATEGORY
    ===================================================== */

    detailCategory.textContent =
        machine.Category || "";


    /* =====================================================
       REMOVE OLD SPECIFICATIONS
    ===================================================== */

    specifications.innerHTML = "";


    /* =====================================================
       GET SPECIFICATIONS FROM GOOGLE SHEET
    ===================================================== */

    const specsText =
        String(
            machine.Specifications || ""
        ).trim();


    if (specsText) {

        const specs =
            specsText
                .split("|")
                .map(function (item) {

                    return item.trim();

                })
                .filter(function (item) {

                    return item.length > 0;

                });


        specs.forEach(
            function (spec) {

                /* =========================================
                   FIND FIRST COLON
                ========================================= */

                const colonIndex =
                    spec.indexOf(":");


                let label =
                    spec;

                let value =
                    "";


                if (colonIndex !== -1) {

                    label =
                        spec
                            .substring(
                                0,
                                colonIndex
                            )
                            .trim();


                    value =
                        spec
                            .substring(
                                colonIndex + 1
                            )
                            .trim();

                }


                /* =========================================
                   CREATE SPEC BOX
                ========================================= */

                const specBox =
                    document.createElement(
                        "div"
                    );


                specBox.className =
                    "spec-box";


                /* =========================================
                   LABEL
                ========================================= */

                const specLabel =
                    document.createElement(
                        "span"
                    );


                specLabel.className =
                    "spec-label";


                specLabel.textContent =
                    label + ":";


                /* =========================================
                   VALUE
                ========================================= */

                const specValue =
                    document.createElement(
                        "span"
                    );


                specValue.className =
                    "spec-value";


                specValue.textContent =
                    value;


                /* =========================================
                   ADD LABEL + VALUE
                ========================================= */

                specBox.appendChild(
                    specLabel
                );


                specBox.appendChild(
                    specValue
                );


                /* =========================================
                   ADD TO MODAL
                ========================================= */

                specifications.appendChild(
                    specBox
                );

            }
        );

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    overlay.classList.add(
        "active"
    );


    /* =====================================================
       STOP BACKGROUND SCROLLING
    ===================================================== */

    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeDetails() {

    const overlay =
        document.getElementById(
            "detailsOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "active"
    );


    /* =====================================================
       RESTORE SCROLLING
    ===================================================== */

    document.body.style.overflow =
        "auto";

}


/* =========================================================
   CLICK OUTSIDE DETAILS BOX
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const detailsOverlay =
            document.getElementById(
                "detailsOverlay"
            );


        if (detailsOverlay) {

            detailsOverlay.addEventListener(
                "click",
                function (event) {

                    /* =====================================
                       CLOSE ONLY WHEN CLICKING BACKGROUND
                    ===================================== */

                    if (
                        event.target ===
                        detailsOverlay
                    ) {

                        closeDetails();

                    }

                }
            );

        }


        /* =================================================
           LOAD EQUIPMENT
        ================================================= */

        loadEquipment();

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeDetails();

        }

    }
);