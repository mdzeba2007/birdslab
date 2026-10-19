/* =====================================================
   PUBLICATIONS API
===================================================== */
const PUBLICATIONS_API =
    "https://script.google.com/macros/s/AKfycbyk-yEUhBu5-Drnu3fqsEk4HF7dYP64VF_xkDLg9HLofk8ANBE7FMhk95Wk5hqXMLFp/exec";


/* =====================================================
   GLOBAL DATA
===================================================== */
let publications = [];


/* =====================================================
   ELEMENTS
===================================================== */
const publicationGrid = document.getElementById("publicationGrid");
const searchInput = document.getElementById("publicationSearch");
const yearFilter = document.getElementById("yearFilter");
const typeFilter = document.getElementById("typeFilter");
const noResults = document.getElementById("noResults");

const refreshBtn = document.getElementById("refreshBtn");
const lastUpdatedEl = document.getElementById("lastUpdated");

const statTotal = document.getElementById("statTotal");
const statJournals = document.getElementById("statJournals");
const statConferences = document.getElementById("statConferences");
const statSections = document.getElementById("statSections");


/* =====================================================
   LOAD / REFRESH PUBLICATIONS
===================================================== */
async function loadPublications() {
    try {
        // Start spinning arrow icon
        refreshBtn.classList.add("refreshing");
        refreshBtn.disabled = true;

        publicationGrid.innerHTML = `
            <div class="no-results">
                Fetching latest data from Google Sheet...
            </div>
        `;

        // Fetch fresh data with timestamp query parameter to bypass cache
        const response = await fetch(PUBLICATIONS_API + "?t=" + Date.now());

        if (!response.ok) {
            throw new Error("Could not fetch publications.");
        }

        const data = await response.json();

        // Extract active items from Google Sheet payload
        publications = (data.publications || []).filter(function(publication) {
            return String(publication.Status || "").trim().toLowerCase() === "active";
        });

        // Update timestamp display
        updateTimestamp();

        // Update summary metrics
        updateStatistics();

        // Populate filters and render grid
        populateYearFilter();
        populateTypeFilter();
        renderPublications();

    } catch (error) {
        console.error("PUBLICATIONS ERROR:", error);
        publicationGrid.innerHTML = `
            <div class="no-results">
                Unable to load publications from Google Sheet.
            </div>
        `;
    } finally {
        // Stop spinning arrow animation
        refreshBtn.classList.remove("refreshing");
        refreshBtn.disabled = false;
    }
}


/* =====================================================
   TIMESTAMP UPDATE
===================================================== */
function updateTimestamp() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const formattedDate = now.toLocaleDateString();
    
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Last fetched: ${formattedDate} at ${formattedTime}`;
    }
}


/* =====================================================
   STATISTICS UPDATE
===================================================== */
function updateStatistics() {
    const total = publications.length;

    const journalCount = publications.filter(function(p) {
        const typeStr = String(p.Type || "").toLowerCase();
        return typeStr.includes("journal");
    }).length;

    const confCount = total - journalCount;

    const distinctTypes = new Set(
        publications
            .map(p => String(p.Type || "").trim())
            .filter(Boolean)
    );

    if (statTotal) statTotal.textContent = total;
    if (statJournals) statJournals.textContent = journalCount;
    if (statConferences) statConferences.textContent = confCount;
    if (statSections) statSections.textContent = distinctTypes.size;
}


/* =====================================================
   POPULATE YEAR FILTER
===================================================== */
function populateYearFilter() {
    const years = [
        ...new Set(
            publications
                .map(p => String(p.Year || "").trim())
                .filter(Boolean)
        )
    ];

    years.sort((a, b) => Number(b) - Number(a));

    yearFilter.innerHTML = `<option value="all">All Years</option>`;

    years.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}


/* =====================================================
   POPULATE TYPE FILTER
===================================================== */
function populateTypeFilter() {
    const types = [
        ...new Set(
            publications
                .map(p => String(p.Type || "").trim())
                .filter(Boolean)
        )
    ];

    types.sort();

    typeFilter.innerHTML = `<option value="all">All Types</option>`;

    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });
}


/* =====================================================
   RENDER PUBLICATIONS
===================================================== */
function renderPublications() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedYear = yearFilter.value;
    const selectedType = typeFilter.value;

    const filteredPublications = publications.filter(function(publication) {
        const searchableText = [
            publication.Type,
            publication.Year,
            publication.Title,
            publication.Authors,
            publication.Journal,
            publication.Citation
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);
        const matchesYear = selectedYear === "all" || String(publication.Year) === selectedYear;
        const matchesType = selectedType === "all" || String(publication.Type) === selectedType;

        return matchesSearch && matchesYear && matchesType;
    });

    publicationGrid.innerHTML = "";

    if (filteredPublications.length === 0) {
        noResults.style.display = "block";
        return;
    }

    noResults.style.display = "none";

    filteredPublications.forEach(function(publication) {
        const card = createPublicationCard(publication);
        publicationGrid.appendChild(card);
    });
}


/* =====================================================
   CREATE PUBLICATION CARD
===================================================== */
function createPublicationCard(publication) {
    const card = document.createElement("article");
    card.className = "publication-card";

    // Top Header
    const top = document.createElement("div");
    top.className = "publication-top";

    const type = document.createElement("span");
    type.className = "publication-type";
    type.textContent = publication.Type || "Publication";

    const year = document.createElement("span");
    year.className = "publication-year";
    year.textContent = publication.Year || "";

    top.appendChild(type);
    top.appendChild(year);

    // Title
    const title = document.createElement("h2");
    title.className = "publication-title";
    title.textContent = publication.Title || "Untitled Publication";

    // Authors
    const authors = document.createElement("p");
    authors.className = "publication-authors";
    authors.textContent = publication.Authors || "";

    // Journal
    const journal = document.createElement("p");
    journal.className = "publication-journal";
    journal.textContent = publication.Journal || "";

    // Action Buttons
    const actions = document.createElement("div");
    actions.className = "publication-actions";

    const pdfButton = document.createElement("a");
    pdfButton.className = "publication-btn";
    pdfButton.target = "_blank";
    pdfButton.rel = "noopener noreferrer";
    pdfButton.innerHTML = `<span class="publication-btn-icon">↓</span> PDF`;

    if (publication.PDF && String(publication.PDF).trim() !== "") {
        pdfButton.href = String(publication.PDF).trim();
    } else {
        pdfButton.href = "#";
        pdfButton.addEventListener("click", function(event) {
            event.preventDefault();
            alert("PDF link is not available.");
        });
    }

    const citeButton = document.createElement("button");
    citeButton.type = "button";
    citeButton.className = "publication-btn";
    citeButton.innerHTML = `<span class="publication-btn-icon">▣</span> Cite`;

    citeButton.addEventListener("click", async function() {
        const citation = String(publication.Citation || "").trim();
        if (!citation) {
            alert("Citation is not available.");
            return;
        }

        try {
            await navigator.clipboard.writeText(citation);
            const oldText = citeButton.innerHTML;
            citeButton.innerHTML = `<span class="publication-btn-icon">✓</span> Copied`;
            setTimeout(function() {
                citeButton.innerHTML = oldText;
            }, 1500);
        } catch (error) {
            console.error("COPY ERROR:", error);
            alert(citation);
        }
    });

    actions.appendChild(pdfButton);
    actions.appendChild(citeButton);

    card.appendChild(top);
    card.appendChild(title);
    card.appendChild(authors);
    card.appendChild(journal);
    card.appendChild(actions);

    return card;
}


/* =====================================================
   EVENT LISTENERS
===================================================== */
refreshBtn.addEventListener("click", loadPublications);
searchInput.addEventListener("input", renderPublications);
yearFilter.addEventListener("change", renderPublications);
typeFilter.addEventListener("change", renderPublications);


/* =====================================================
   INITIALIZATION
===================================================== */
document.addEventListener("DOMContentLoaded", function() {
    loadPublications();
});