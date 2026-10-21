
/**
 * ============================================================================
 * PUBLICATIONS.JS — BIRDLab, IIT Jodhpur
 * Google Scholar + Google Sheets Publications Component
 * ============================================================================
 *
 * Features:
 * 1. Fetches publications from Google Apps Script.
 * 2. Falls back to Google Sheets GVIZ.
 * 3. Supports search, filters, sorting, and pagination.
 * 4. Calculates statistics from available publication records.
 * 5. Removes duplicate publications.
 * 6. Handles loading, errors, and empty results.
 * 7. Escapes text before inserting it into HTML.
 *
 * Integration:
 * Add this file to your website and load it with:
 * <script src="publications.js" defer></script>
 * ============================================================================
 */

(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------------------------------

  const CONFIG = {
    scholarId: "3KZSSEIAAAAJ",

    scholarUrl:
      "https://scholar.google.com/citations?user=3KZSSEIAAAAJ&hl=en",

    apiUrl:
      "https://script.google.com/macros/s/AKfycbyk-yEUhBu5-Drnu3fqsEk4HF7dYP64VF_xkDLg9HLofk8ANBE7FMhk95Wk5hqXMLFp/exec",

    sheetId: "1TtI9ameanz3d5bQUIVZ24d3C9aBykpKT4KtgrefsSDc",

    pageSize: 9,

    requestTimeout: 8000
  };

  // Add only verified publications here if you want a local fallback.
  // Example:
  // {
  //   title: "Verified publication title",
  //   authors: "Author names",
  //   journal: "Journal name",
  //   year: 2025,
  //   type: "journal",
  //   citations: 0,
  //   abstract: "",
  //   doiUrl: "https://doi.org/...",
  //   id: "local-1"
  // }

  const DEFAULT_PUBLICATIONS = [];

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  let allPublications = [];
  let filteredPublications = [];
  let currentPage = 1;
  let currentSearch = "";
  let currentType = "all";
  let currentYear = "all";
  let currentSort = "newest";
  let isLoading = false;

  // --------------------------------------------------------------------------
  // DOM HELPERS
  // --------------------------------------------------------------------------

  function findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  function getElements() {
    return {
      container: findElement([
        "#publications-container",
        "#publications-grid",
        "#publication-list",
        ".publications-grid",
        ".publications-container",
        "[data-publications-container]"
      ]),

      search: findElement([
        "#publication-search",
        "#publications-search",
        "#search-publications",
        "[data-publication-search]"
      ]),

      typeFilter: findElement([
        "#publication-type-filter",
        "#type-filter",
        "[data-publication-type-filter]"
      ]),

      yearFilter: findElement([
        "#publication-year-filter",
        "#year-filter",
        "[data-publication-year-filter]"
      ]),

      sort: findElement([
        "#publication-sort",
        "#sort-publications",
        "[data-publication-sort]"
      ]),

      pagination: findElement([
        "#publications-pagination",
        "#publication-pagination",
        "[data-publications-pagination]"
      ]),

      loading: findElement([
        "#publications-loading",
        "[data-publications-loading]"
      ]),

      empty: findElement([
        "#publications-empty",
        "[data-publications-empty]"
      ]),

      error: findElement([
        "#publications-error",
        "[data-publications-error]"
      ])
    };
  }

  // --------------------------------------------------------------------------
  // SECURITY / FORMATTING HELPERS
  // --------------------------------------------------------------------------

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim();
  }

  function normalizeKey(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function cleanTitle(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function getField(item, names, fallback = "") {
    if (!item || typeof item !== "object") {
      return fallback;
    }

    const keys = Object.keys(item);

    for (const name of names) {
      const target = normalizeKey(name);

      const key = keys.find(
        candidate => normalizeKey(candidate) === target
      );

      if (
        key !== undefined &&
        item[key] !== undefined &&
        item[key] !== null
      ) {
        const value = String(item[key]).trim();

        if (value !== "") return value;
      }
    }

    return fallback;
  }

  function parseYear(value) {
    const match = String(value ?? "").match(/\b(19\d{2}|20\d{2})\b/);

    if (!match) return null;

    const year = Number(match[1]);
    const currentYear = new Date().getFullYear();

    return year >= 1900 && year <= currentYear + 2
      ? year
      : null;
  }

  function parseCount(value) {
    const result = Number.parseInt(
      String(value ?? "0").replace(/,/g, ""),
      10
    );

    return Number.isFinite(result) && result >= 0 ? result : 0;
  }

  function normalizeType(value) {
    const type = normalizeText(value || "journal").toLowerCase();

    const aliases = {
      "journal article": "journal",
      "research article": "journal",
      "conference paper": "conference",
      "conference proceeding": "conference",
      "conference proceedings": "conference",
      "book chapter": "book-chapter",
      "book-chapter": "book-chapter"
    };

    return aliases[type] || type || "journal";
  }

  function normalizeUrl(value) {
    let candidate = normalizeText(value);

    if (!candidate) return "";

    if (/^10\.\d{4,9}\//i.test(candidate)) {
      candidate = "https://doi.org/" + candidate;
    } else if (
      !/^https?:\/\//i.test(candidate) &&
      !/^[a-z][a-z\d+.-]*:/i.test(candidate)
    ) {
      candidate = "https://" + candidate;
    }

    try {
      const url = new URL(candidate);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  function getSafeLink(url, label) {
    const safeUrl = normalizeUrl(url);

    if (!safeUrl) return "";

    return `
      <a
        href="${escapeHTML(safeUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="publication-link"
        aria-label="${escapeHTML(label)}"
      >
        ${escapeHTML(label)}
      </a>
    `;
  }

  // --------------------------------------------------------------------------
  // ACTIVE STATUS
  // --------------------------------------------------------------------------

  function isItemActive(item) {
    if (!item || typeof item !== "object") return false;

    const status = getField(item, [
      "Status",
      "State",
      "Visibility",
      "Active"
    ]).toLowerCase();

    if (!status) return true;

    return ![
      "inactive",
      "draft",
      "hidden",
      "deleted",
      "archived",
      "false",
      "0",
      "no",
      "unpublished"
    ].includes(status);
  }

  // --------------------------------------------------------------------------
  // API RESPONSE PARSING
  // --------------------------------------------------------------------------

  function extractRowsFromResponse(data) {
    if (Array.isArray(data)) return data;

    if (!data || typeof data !== "object") return [];

    const possibleKeys = [
      "publications",
      "items",
      "data",
      "records",
      "rows",
      "values",
      "result",
      "content"
    ];

    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    // Google Visualization API response.
    if (data.table && Array.isArray(data.table.rows)) {
      const columns = (data.table.cols || []).map(
        (column, index) =>
          column.label || column.id || `column_${index}`
      );

      return data.table.rows.map(row => {
        const result = {};

        (row.c || []).forEach((cell, index) => {
          result[columns[index] || `column_${index}`] =
            cell == null ? "" : (cell.f ?? cell.v ?? "");
        });

        return result;
      });
    }

    return [];
  }

  // --------------------------------------------------------------------------
  // PUBLICATION PARSER
  // --------------------------------------------------------------------------

  function parseRowToPublication(item, index) {
    if (!item) return null;

    let publication;

    // Array format:
    // [Title, Authors, Journal, Year, Type, Citations, Abstract, Link]
    if (Array.isArray(item)) {
      const title = normalizeText(item[0]);

      if (
        !title ||
        ["title", "paper title"].includes(title.toLowerCase())
      ) {
        return null;
      }

      publication = {
        id: `sheet-${index + 1}`,
        title,
        authors: normalizeText(item[1]),
        journal: normalizeText(item[2]),
        year: parseYear(item[3]),
        type: normalizeType(item[4]),
        citations: parseCount(item[5]),
        abstract: normalizeText(item[6]),
        doiUrl: normalizeUrl(item[7]),
        fromSheet: true
      };
    } else if (typeof item === "object") {
      if (!isItemActive(item)) return null;

      const title = getField(item, [
        "Title",
        "Paper Title",
        "Publication Title",
        "Name",
        "Heading"
      ]);

      if (
        !title ||
        ["title", "paper title"].includes(title.toLowerCase())
      ) {
        return null;
      }

      const rawYear = getField(item, [
        "Year",
        "Date",
        "Publication Year",
        "PubYear"
      ]);

      publication = {
        id: getField(item, ["ID", "Publication ID"]) ||
          `sheet-${index + 1}`,

        title,

        authors: getField(item, [
          "Authors",
          "Author",
          "Author(s)",
          "Researchers",
          "By"
        ]),

        journal: getField(item, [
          "Journal",
          "Venue",
          "Conference",
          "Publisher",
          "Source",
          "Book"
        ]),

        year: parseYear(rawYear),

        type: normalizeType(getField(item, [
          "Type",
          "Category",
          "Paper Type",
          "Publication Type"
        ])),

        citations: parseCount(getField(item, [
          "Citations",
          "Citation",
          "Cited by",
          "Cited By",
          "CitedBy"
        ])),

        abstract: getField(item, [
          "Abstract",
          "Description",
          "Summary",
          "Details"
        ]),

        doiUrl: normalizeUrl(getField(item, [
          "DOI",
          "Link",
          "URL",
          "PDF",
          "Paper Link",
          "Download"
        ])),

        fromSheet: true
      };
    } else {
      return null;
    }

    // Do not invent authors, years, or citation counts.
    return {
      ...publication,
      authors: publication.authors || "Authors not specified",
      journal: publication.journal || "Publication venue not specified"
    };
  }

  // --------------------------------------------------------------------------
  // FETCH HELPERS
  // --------------------------------------------------------------------------

  async function fetchWithTimeout(url, timeout = CONFIG.requestTimeout) {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      timeout
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchFromAppsScript() {
    const separator = CONFIG.apiUrl.includes("?") ? "&" : "?";

    const response = await fetchWithTimeout(
      CONFIG.apiUrl + separator + "t=" + Date.now()
    );

    const data = await response.json();
    const rows = extractRowsFromResponse(data);

    if (!rows.length) {
      throw new Error("Apps Script returned no publication rows.");
    }

    return rows;
  }

  async function fetchFromGVIZ() {
    const url =
      `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}` +
      `/gviz/tq?tqx=out:json&t=${Date.now()}`;

    const response = await fetchWithTimeout(url);
    const text = await response.text();

    const match = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/
    );

    if (!match) {
      throw new Error("Could not parse the Google Sheets response.");
    }

    const data = JSON.parse(match[1]);
    const rows = extractRowsFromResponse(data);

    if (!rows.length) {
      throw new Error("Google Sheets returned no rows.");
    }

    return rows;
  }

  async function fetchPublications() {
    try {
      const rows = await fetchFromAppsScript();

      console.info("[BIRDLab] Loaded rows from Apps Script:", rows.length);

      return rows;
    } catch (error) {
      console.warn("[BIRDLab] Apps Script unavailable:", error.message);
    }

    try {
      const rows = await fetchFromGVIZ();

      console.info("[BIRDLab] Loaded rows from Google Sheets:", rows.length);

      return rows;
    } catch (error) {
      console.warn("[BIRDLab] Google Sheets fallback failed:", error.message);
    }

    return [];
  }

  // --------------------------------------------------------------------------
  // MERGE / DEDUPLICATE
  // --------------------------------------------------------------------------

  function mergeWithDefaults(sheetPublications) {
    const result = [];
    const seen = new Set();

    function add(publication) {
      if (!publication || !publication.title) return;

      const key = cleanTitle(publication.title);

      if (!key || seen.has(key)) return;

      seen.add(key);
      result.push(publication);
    }

    // Sheet entries take priority.
    sheetPublications.forEach(add);

    DEFAULT_PUBLICATIONS.forEach(publication => {
      add({
        ...publication,
        fromSheet: false
      });
    });

    result.sort((a, b) => {
      const yearA = Number(a.year) || 0;
      const yearB = Number(b.year) || 0;

      if (yearA !== yearB) return yearB - yearA;

      if (a.fromSheet && !b.fromSheet) return -1;
      if (!a.fromSheet && b.fromSheet) return 1;

      return 0;
    });

    return result;
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  function computeStats(publications) {
    const citations = publications
      .map(p => parseCount(p.citations))
      .sort((a, b) => b - a);

    const totalCitations = citations.reduce(
      (sum, value) => sum + value,
      0
    );

    let hIndex = 0;

    citations.forEach((count, index) => {
      if (count >= index + 1) {
        hIndex = index + 1;
      }
    });

    const countType = type =>
      publications.filter(
        p => normalizeType(p.type) === type
      ).length;

    return {
      totalCount: publications.length,
      totalCitations,
      hIndex,
      i10Index: citations.filter(value => value >= 10).length,
      journalCount: countType("journal"),
      conferenceCount: countType("conference"),
      reviewCount: countType("review"),
      patentCount: countType("patent")
    };
  }

  function updateStatistics(publications) {
    const stats = computeStats(publications);

    const selectors = {
      totalCount: [
        "#total-publications",
        "#publication-count",
        "[data-stat='total-publications']"
      ],

      totalCitations: [
        "#total-citations",
        "[data-stat='total-citations']"
      ],

      hIndex: [
        "#h-index",
        "[data-stat='h-index']"
      ],

      i10Index: [
        "#i10-index",
        "[data-stat='i10-index']"
      ],

      journalCount: [
        "#journal-count",
        "[data-stat='journal-count']"
      ],

      conferenceCount: [
        "#conference-count",
        "[data-stat='conference-count']"
      ]
    };

    Object.entries(selectors).forEach(([key, list]) => {
      const element = findElement(list);

      if (element) {
        element.textContent = stats[key].toLocaleString("en-IN");
      }
    });

    return stats;
  }

  // --------------------------------------------------------------------------
  // FILTER OPTIONS
  // --------------------------------------------------------------------------

  function populateFilter(select, values, allLabel) {
    if (!select) return;

    const previousValue = select.value || "all";

    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = allLabel;

    select.appendChild(allOption);

    values.forEach(value => {
      const option = document.createElement("option");

      option.value = String(value);
      option.textContent = String(value);

      select.appendChild(option);
    });

    select.value = values.map(String).includes(previousValue)
      ? previousValue
      : "all";
  }

  function populateFilters() {
    const elements = getElements();

    const types = [
      ...new Set(
        allPublications.map(p => normalizeType(p.type))
      )
    ].filter(Boolean).sort();

    const years = [
      ...new Set(
        allPublications
          .map(p => p.year)
          .filter(Number.isFinite)
      )
    ].sort((a, b) => b - a);

    populateFilter(elements.typeFilter, types, "All Types");
    populateFilter(elements.yearFilter, years, "All Years");
  }

  // --------------------------------------------------------------------------
  // SEARCH / SORT / FILTER
  // --------------------------------------------------------------------------

  function applyFilters() {
    const search = currentSearch.toLowerCase();

    filteredPublications = allPublications.filter(publication => {
      const matchesSearch = [
        publication.title,
        publication.authors,
        publication.journal,
        publication.abstract,
        publication.year
      ].join(" ").toLowerCase().includes(search);

      const matchesType =
        currentType === "all" ||
        normalizeType(publication.type) === currentType;

      const matchesYear =
        currentYear === "all" ||
        String(publication.year) === currentYear;

      return matchesSearch && matchesType && matchesYear;
    });

    filteredPublications.sort((a, b) => {
      if (currentSort === "oldest") {
        return (a.year || 0) - (b.year || 0);
      }

      if (currentSort === "citations") {
        return (b.citations || 0) - (a.citations || 0);
      }

      if (currentSort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      return (b.year || 0) - (a.year || 0);
    });

    currentPage = 1;
    renderPublications();
  }

  // --------------------------------------------------------------------------
  // PUBLICATION CARD
  // --------------------------------------------------------------------------

  function createPublicationCard(publication) {
    const title = escapeHTML(publication.title);
    const authors = escapeHTML(publication.authors);
    const journal = escapeHTML(publication.journal);
    const abstract = escapeHTML(publication.abstract);
    const year = publication.year || "Year unavailable";
    const type = escapeHTML(normalizeType(publication.type));
    const citations = parseCount(publication.citations);

    const link = getSafeLink(
      publication.doiUrl,
      "View paper"
    );

    const card = document.createElement("article");

    card.className = "publication-card";

    card.innerHTML = `
      <div class="publication-card-content">

        <div class="publication-meta">
          <span class="publication-type">${type}</span>
          <span class="publication-year">${escapeHTML(year)}</span>
        </div>

        <h3 class="publication-title">${title}</h3>

        <p class="publication-authors">
          <strong>Authors:</strong> ${authors}
        </p>

        <p class="publication-journal">${journal}</p>

        ${
          abstract
            ? `<p class="publication-abstract">${abstract}</p>`
            : ""
        }

        <div class="publication-footer">
          <span class="publication-citations">
            Citations: ${citations}
          </span>

          ${link}
        </div>

      </div>
    `;

    return card;
  }

  // --------------------------------------------------------------------------
  // RENDER PUBLICATIONS
  // --------------------------------------------------------------------------

  function renderPublications() {
    const elements = getElements();

    if (!elements.container) {
      console.warn(
        "[BIRDLab] Publications container not found. " +
        "Add #publications-container to your HTML."
      );

      return;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(filteredPublications.length / CONFIG.pageSize)
    );

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * CONFIG.pageSize;

    const pageItems = filteredPublications.slice(
      start,
      start + CONFIG.pageSize
    );

    elements.container.replaceChildren();

    pageItems.forEach(publication => {
      elements.container.appendChild(
        createPublicationCard(publication)
      );
    });

    if (elements.loading) {
      elements.loading.hidden = true;
    }

    if (elements.empty) {
      elements.empty.hidden = filteredPublications.length !== 0;
    }

    if (elements.error) {
      elements.error.hidden = true;
    }

    renderPagination(totalPages);

    const countElement = findElement([
      "#publications-results-count",
      "[data-publications-results-count]"
    ]);

    if (countElement) {
      countElement.textContent =
        `Showing ${filteredPublications.length} publication(s)`;
    }
  }

  // --------------------------------------------------------------------------
  // PAGINATION
  // --------------------------------------------------------------------------

  function renderPagination(totalPages) {
    const pagination = getElements().pagination;

    if (!pagination) return;

    pagination.replaceChildren();

    if (filteredPublications.length <= CONFIG.pageSize) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "Previous";
    previous.disabled = currentPage <= 1;

    previous.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPublications();
      }
    });

    const status = document.createElement("span");
    status.textContent = `Page ${currentPage} of ${totalPages}`;
    status.setAttribute("aria-live", "polite");

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    next.disabled = currentPage >= totalPages;

    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPublications();
      }
    });

    pagination.append(previous, status, next);
  }

  // --------------------------------------------------------------------------
  // UI EVENT HANDLERS
  // --------------------------------------------------------------------------

  function bindEvents() {
    const elements = getElements();

    if (elements.search) {
      elements.search.addEventListener("input", event => {
        currentSearch = event.target.value.trim();
        applyFilters();
      });
    }

    if (elements.typeFilter) {
      elements.typeFilter.addEventListener("change", event => {
        currentType = event.target.value;
        applyFilters();
      });
    }

    if (elements.yearFilter) {
      elements.yearFilter.addEventListener("change", event => {
        currentYear = event.target.value;
        applyFilters();
      });
    }

    if (elements.sort) {
      elements.sort.addEventListener("change", event => {
        currentSort = event.target.value;
        applyFilters();
      });
    }
  }

  // --------------------------------------------------------------------------
  // MAIN INITIALIZATION
  // --------------------------------------------------------------------------

  async function init() {
    if (isLoading) return;

    isLoading = true;

    const elements = getElements();

    if (elements.loading) elements.loading.hidden = false;
    if (elements.empty) elements.empty.hidden = true;
    if (elements.error) elements.error.hidden = true;

    bindEvents();

    try {
      const rows = await fetchPublications();

      const parsed = rows
        .map(parseRowToPublication)
        .filter(Boolean);

      allPublications = mergeWithDefaults(parsed);

      updateStatistics(allPublications);
      populateFilters();

      filteredPublications = [...allPublications];

      applyFilters();

      if (allPublications.length === 0 && elements.error) {
        elements.error.textContent =
          "Publications could not be loaded. Please try again later.";

        elements.error.hidden = false;
      }

      console.info(
        `[BIRDLab] Publications initialized: ${allPublications.length}`
      );
    } catch (error) {
      console.error("[BIRDLab] Initialization failed:", error);

      allPublications = mergeWithDefaults([]);
      filteredPublications = [...allPublications];

      updateStatistics(allPublications);
      populateFilters();
      renderPublications();

      if (elements.error) {
        elements.error.textContent =
          "Unable to load publications. Please check your connection and try again.";

        elements.error.hidden = false;
      }
    } finally {
      isLoading = false;

      if (elements.loading) {
        elements.loading.hidden = true;
      }
    }
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  window.BIRDLabPublications = {
    init,

    refresh: init,

    getPublications: () => [...allPublications],

    getStatistics: () => computeStats(allPublications),

    search: query => {
      currentSearch = String(query ?? "");

      const searchInput = getElements().search;

      if (searchInput) {
        searchInput.value = currentSearch;
      }

      applyFilters();
    }
  };

  // --------------------------------------------------------------------------
  // START
  // --------------------------------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
