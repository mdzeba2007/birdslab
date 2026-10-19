// =====================================================
// BIRDLAB LECTURES / COURSES
// GOOGLE SHEET + FILTERING
// =====================================================

const LECTURES_API =
    "https://script.google.com/macros/s/AKfycbxD9_z6LrLMhWtFwX0z8EePPSa1CKL8VZVeY8WGlgK7R0hXrr4Wm87iBecnZXBVvif1EQ/exec";


let lectures = [];


// =====================================================
// LOAD AFTER HTML IS READY
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const levelSelect =
        document.getElementById("course-level");

    const deptSelect =
        document.getElementById("department");

    const coursesGrid =
        document.getElementById("courses-grid");


    if (!coursesGrid) {
        console.error("courses-grid not found.");
        return;
    }


    // =================================================
    // LOAD COURSES FROM GOOGLE SHEET
    // =================================================

    async function loadLectures() {

        try {

            coursesGrid.innerHTML = `
                <p style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px;
                    color: #667f92;
                    font-size: 18px;
                ">
                    Loading courses...
                </p>
            `;


            const response =
                await fetch(
                    LECTURES_API +
                    "?t=" +
                    Date.now()
                );


            if (!response.ok) {
                throw new Error(
                    "Failed to fetch courses."
                );
            }


            const data =
                await response.json();


            console.log(
                "LECTURES DATA:",
                data
            );


            // =============================================
            // ONLY ACTIVE COURSES
            // =============================================

            lectures =
                (data.lectures || [])
                    .filter(function (lecture) {

                        return String(
                            lecture.Status || ""
                        )
                        .trim()
                        .toLowerCase() !== "inactive";

                    });


            // =============================================
            // CREATE FILTER OPTIONS FROM SHEET
            // =============================================

            populateLevelFilter();

            populateDepartmentFilter();


            // =============================================
            // SHOW COURSES
            // =============================================

            renderCourses();


        } catch (error) {

            console.error(
                "LECTURES LOAD ERROR:",
                error
            );


            coursesGrid.innerHTML = `
                <p style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px;
                    color: red;
                    font-size: 18px;
                ">
                    Unable to load courses.
                </p>
            `;

        }

    }


    // =================================================
    // LEVEL FILTER OPTIONS
    // =================================================

    function populateLevelFilter() {

        if (!levelSelect) return;


        const levels =
            [
                ...new Set(

                    lectures
                        .map(function (lecture) {

                            return String(
                                lecture.Level || ""
                            ).trim();

                        })
                        .filter(Boolean)

                )
            ];


        levelSelect.innerHTML = `
            <option value="all">
                All Levels
            </option>
        `;


        levels.forEach(function (level) {

            const option =
                document.createElement("option");


            option.value =
                level.toLowerCase();


            option.textContent =
                level;


            levelSelect.appendChild(
                option
            );

        });

    }


    // =================================================
    // DEPARTMENT FILTER OPTIONS
    // =================================================

    function populateDepartmentFilter() {

        if (!deptSelect) return;


        const departments =
            [
                ...new Set(

                    lectures
                        .map(function (lecture) {

                            return String(
                                lecture["Department Code"] || ""
                            ).trim();

                        })
                        .filter(Boolean)

                )
            ];


        deptSelect.innerHTML = `
            <option value="all">
                All Departments
            </option>
        `;


        departments.forEach(function (department) {

            const option =
                document.createElement("option");


            option.value =
                department.toLowerCase();


            option.textContent =
                department;


            deptSelect.appendChild(
                option
            );

        });

    }


    // =================================================
    // RENDER COURSES
    // =================================================

    function renderCourses() {

        const selectedLevel =
            levelSelect
                ? levelSelect.value.toLowerCase()
                : "all";


        const selectedDept =
            deptSelect
                ? deptSelect.value.toLowerCase()
                : "all";


        const filteredCourses =
            lectures.filter(function (lecture) {

                const courseLevel =
                    String(
                        lecture.Level || ""
                    )
                    .trim()
                    .toLowerCase();


                const courseDept =
                    String(
                        lecture["Department Code"] || ""
                    )
                    .trim()
                    .toLowerCase();


                const matchesLevel =
                    selectedLevel === "all" ||
                    courseLevel === selectedLevel;


                const matchesDept =
                    selectedDept === "all" ||
                    courseDept === selectedDept;


                return (
                    matchesLevel &&
                    matchesDept
                );

            });


        coursesGrid.innerHTML = "";


        if (filteredCourses.length === 0) {

            coursesGrid.innerHTML = `
                <p style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px;
                    color: #667f92;
                    font-size: 18px;
                ">
                    No courses available.
                </p>
            `;

            return;
        }


        filteredCourses.forEach(function (lecture) {

            const card =
                createCourseCard(lecture);


            coursesGrid.appendChild(
                card
            );

        });

    }


    // =================================================
    // CREATE COURSE CARD
    // USING YOUR EXISTING CSS CLASSES
    // =================================================

    function createCourseCard(lecture) {

        const card =
            document.createElement("article");


        card.className =
            "card";


        // =============================================
        // DATA ATTRIBUTES
        // =============================================

        card.setAttribute(
            "data-level",
            String(
                lecture.Level || ""
            )
            .trim()
            .toLowerCase()
        );


        card.setAttribute(
            "data-dept",
            String(
                lecture["Department Code"] || ""
            )
            .trim()
            .toLowerCase()
        );


        // =============================================
        // CARD HEADER
        // =============================================

        const cardHeader =
            document.createElement("div");


        cardHeader.className =
            "card-header";


        // =============================================
        // TAGS
        // =============================================

        const tags =
            document.createElement("div");


        tags.className =
            "tags";


        const departmentTag =
            document.createElement("span");


        departmentTag.className =
            "tag tag-purple";


        departmentTag.textContent =
            lecture["Department Code"] ||
            "";


        const levelTag =
            document.createElement("span");


        levelTag.className =
            "tag tag-teal";


        levelTag.textContent =
            lecture.Level ||
            "";


        tags.appendChild(
            departmentTag
        );


        tags.appendChild(
            levelTag
        );


        // =============================================
        // COURSE CODE + CREDITS
        // =============================================

        const courseMeta =
            document.createElement("div");


        courseMeta.className =
            "course-meta";


        const code =
            document.createElement("span");


        code.className =
            "code";


        code.textContent =
            lecture["Course Code"] ||
            "";


        const credits =
            document.createElement("span");


        credits.className =
            "credits";


        credits.textContent =
            lecture.Credits
                ? lecture.Credits + " Credits"
                : "";


        courseMeta.appendChild(
            code
        );


        courseMeta.appendChild(
            credits
        );


        cardHeader.appendChild(
            tags
        );


        cardHeader.appendChild(
            courseMeta
        );


        // =============================================
        // TITLE
        // =============================================

        const title =
            document.createElement("h2");


        title.className =
            "course-title";


        title.textContent =
            lecture.Title ||
            "Untitled Course";


        // =============================================
        // DETAILS LIST
        // =============================================

        const detailsList =
            document.createElement("ul");


        detailsList.className =
            "details-list";


        // ---------------------------------------------
        // DEPARTMENT
        // ---------------------------------------------

        const departmentItem =
            document.createElement("li");


        departmentItem.innerHTML = `
            <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
        `;


        departmentItem.appendChild(
            document.createTextNode(
                lecture.Department ||
                ""
            )
        );


        // ---------------------------------------------
        // LEVEL
        // ---------------------------------------------

        const levelItem =
            document.createElement("li");


        levelItem.innerHTML = `
            <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
        `;


        levelItem.appendChild(
            document.createTextNode(
                (lecture.Level || "") +
                " Level"
            )
        );


        detailsList.appendChild(
            departmentItem
        );


        detailsList.appendChild(
            levelItem
        );


        // =============================================
        // DESCRIPTION
        // =============================================

        const description =
            document.createElement("p");


        description.className =
            "description";


        description.textContent =
            lecture.Description ||
            "";


        // =============================================
        // BUTTONS
        // =============================================

        const cardButtons =
            document.createElement("div");


        cardButtons.className =
            "card-buttons";


        // =============================================
        // COURSE DETAILS
        // =============================================

        const detailsButton =
            document.createElement("a");


        detailsButton.className =
            "btn btn-outline";


        const detailsURL =
            String(
                lecture["Course Details Link"] ||
                ""
            ).trim();


        detailsButton.href =
            detailsURL || "#";


        detailsButton.innerHTML = `
            <span>
                Course Details
            </span>

            <svg
                class="btn-arrow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                ></line>

                <polyline
                    points="12 5 19 12 12 19"
                ></polyline>
            </svg>
        `;


        if (detailsURL !== "") {

            detailsButton.target =
                "_blank";

            detailsButton.rel =
                "noopener noreferrer";

        } else {

            detailsButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                }
            );

        }


        // =============================================
        // ENROLLMENT
        // =============================================

        const enrollmentButton =
            document.createElement("a");


        enrollmentButton.className =
            "btn btn-filled";


        const enrollmentURL =
            String(
                lecture["Enrollment Link"] ||
                ""
            ).trim();


        enrollmentButton.href =
            enrollmentURL || "#";


        enrollmentButton.innerHTML = `
            <span>
                Enrollment
            </span>
        `;


        if (enrollmentURL !== "") {

            enrollmentButton.target =
                "_blank";

            enrollmentButton.rel =
                "noopener noreferrer";

        } else {

            enrollmentButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                }
            );

        }


        // =============================================
        // ADD BUTTONS
        // =============================================

        cardButtons.appendChild(
            detailsButton
        );


        cardButtons.appendChild(
            enrollmentButton
        );


        // =============================================
        // BUILD CARD
        // =============================================

        card.appendChild(
            cardHeader
        );


        card.appendChild(
            title
        );


        card.appendChild(
            detailsList
        );


        card.appendChild(
            description
        );


        card.appendChild(
            cardButtons
        );


        return card;

    }


    // =================================================
    // FILTER EVENTS
    // =================================================

    if (levelSelect) {

        levelSelect.addEventListener(
            "change",
            renderCourses
        );

    }


    if (deptSelect) {

        deptSelect.addEventListener(
            "change",
            renderCourses
        );

    }


    // =================================================
    // START
    // =================================================

    loadLectures();

});