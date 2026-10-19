
const COLLABORATIONS_API =
  "https://script.google.com/macros/s/AKfycbyfFGDWpqowUc6rZaZn78iRF_HfqSSccQ1HHhk8huFTezbTphMh9ACbtrrPic7zJUsf/exec";

const track = document.getElementById("track");
const progressBar = document.getElementById("progressBar");

let scrollDirection = 1;
let autoScrollTimer = null;

// Read a field from a Google Sheets row
function getField(item, names) {
  const key = Object.keys(item).find((key) =>
    names.some((name) => key.trim().toLowerCase() === name.toLowerCase())
  );

  return key ? String(item[key] ?? "").trim() : "";
}

// Convert Google Drive sharing links to image URLs
function convertDriveURL(url) {
  if (!url) return "";

  const match = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|thumbnail\?id=)([a-zA-Z0-9_-]+)/
  );

  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  }

  return url;
}

// Create a card with visible text, even if no photo is available
function createCollaborationCard(item) {
  const name = getField(item, ["Name", "name"]);
  const category =
    getField(item, ["Category", "category"]) || "Collaboration";
  const photo = getField(item, [
    "Photo URL",
    "PhotoURL",
    "Photo",
    "Image",
    "image",
  ]);

  if (!name) return null;

  const card = document.createElement("div");
  card.className = "card";

  card.style.position = "relative";
  card.style.minHeight = "220px";
  card.style.backgroundColor = "#e5e7eb";
  card.style.backgroundSize = "cover";
  card.style.backgroundPosition = "center";
  card.style.borderRadius = "12px";
  card.style.overflow = "hidden";
  card.style.flexShrink = "0";

  if (photo) {
    const imageURL = convertDriveURL(photo);
    card.style.backgroundImage = `url("${imageURL.replace(/"/g, "%22")}")`;
  }

  const overlay = document.createElement("div");
  overlay.className = "card-overlay";

  overlay.style.position = "absolute";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.padding = "20px";
  overlay.style.background = "rgba(0, 0, 0, 0.68)";
  overlay.style.color = "#ffffff";
  overlay.style.opacity = "1";
  overlay.style.visibility = "visible";
  overlay.style.zIndex = "2";

  const categoryText = document.createElement("p");
  categoryText.className = "card-category";
  categoryText.textContent = category;

  const nameText = document.createElement("h3");
  nameText.className = "card-title";
  nameText.textContent = name;

  overlay.appendChild(categoryText);
  overlay.appendChild(nameText);
  card.appendChild(overlay);

  return card;
}

// Load collaborations from Google Sheets
async function loadCollaborations() {
  try {
    const response = await fetch(
      COLLABORATIONS_API + "?t=" + Date.now()
    );

    if (!response.ok) {
      throw new Error("API returned status " + response.status);
    }

    const result = await response.json();

    // Accept common API response formats
    const collaborations = Array.isArray(result)
      ? result
      : result.collaborations ||
        result.profiles ||
        result.data ||
        [];

    if (!Array.isArray(collaborations)) {
      throw new Error("The API did not return a list of collaborations.");
    }

    track.innerHTML = "";

    collaborations.forEach((item) => {
      const card = createCollaborationCard(item);

      if (card) {
        track.appendChild(card);
      }
    });

    if (collaborations.length === 0) {
      track.innerHTML =
        '<p style="padding:20px;color:#333;">No collaborations found. Check your Google Sheet and API response.</p>';
    }

    updateProgressBar();
    startAutoScroll();

    console.log("Collaborations loaded:", collaborations);
  } catch (error) {
    console.error("Could not load collaborations:", error);

    track.innerHTML =
      '<p style="padding:20px;color:#333;">Unable to load collaborations. Please check the API URL and Google Sheets deployment.</p>';
  }
}

// Update progress bar
function updateProgressBar() {
  if (!track || !progressBar) return;

  const maxScroll = track.scrollWidth - track.clientWidth;

  const scrollPercentage =
    maxScroll > 0 ? (track.scrollLeft / maxScroll) * 100 : 0;

  progressBar.style.width = scrollPercentage + "%";
}

if (track && progressBar) {
  track.addEventListener("scroll", updateProgressBar);
  window.addEventListener("resize", updateProgressBar);
}

// Auto-scroll back and forth
function autoScroll() {
  if (!track) return;

  const maxScroll = track.scrollWidth - track.clientWidth;

  if (maxScroll <= 0) {
    updateProgressBar();
    return;
  }

  if (track.scrollLeft >= maxScroll - 2) {
    scrollDirection = -1;
  } else if (track.scrollLeft <= 0) {
    scrollDirection = 1;
  }

  track.scrollLeft += scrollDirection * 2;
  updateProgressBar();
}

function startAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
  }

  scrollDirection = 1;
  autoScrollTimer = setInterval(autoScroll, 30);
}

// Start after the HTML has loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadCollaborations);
} else {
  loadCollaborations();
}
