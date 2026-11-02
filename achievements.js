
// ==========================================
// BIRD LAB - LAB ACHIEVEMENTS
// Google Apps Script Integration
// ==========================================

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxoS1-PPRnLcwrmtWrpRY8QijuKJFaYNwFYHq-iLIczinVS478nP5c0FkBGPmp9dqaxJg/exec";

const gallery = document.getElementById("achievementsGallery");
const emptyMessage = document.getElementById("noAchievements");

let allAchievements = [];
let currentFilter = "All";

// ==========================================
// VALIDATE MEDIA URL
// ==========================================

function safeURL(url) {
    try {
        const parsed = new URL(url);

        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        ) {
            return parsed.href;
        }
    } catch (error) {
        return "";
    }

    return "";
}

// ==========================================
// YOUTUBE VIDEO EMBED
// ==========================================

function getYouTubeEmbed(url) {
    try {
        const parsed = new URL(url);

        if (parsed.hostname === "youtu.be") {
            return "https://www.youtube.com/embed/" +
                parsed.pathname.slice(1);
        }

        if (
            parsed.hostname.endsWith("youtube.com") &&
            parsed.pathname === "/watch"
        ) {
            const videoId = parsed.searchParams.get("v");

            if (videoId) {
                return "https://www.youtube.com/embed/" + videoId;
            }
        }

        if (
            parsed.hostname.endsWith("youtube.com") &&
            parsed.pathname.startsWith("/embed/")
        ) {
            return parsed.href;
        }

    } catch (error) {
        return "";
    }

    return "";
}

// ==========================================
// LOAD DATA FROM GOOGLE SHEET
// ==========================================

async function loadAchievements() {

    try {

        const response = await fetch(SHEET_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch Google Sheet");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                data.error || "Invalid Google Sheet data"
            );
        }

        allAchievements = data.map(item => ({

            title: item.Title || "",
            description: item.Description || "",
            type: item.Type || "",
            mediaURL: item.MediaURL || "",
            date: item.Date || ""

        })).filter(item =>
            item.title && item.mediaURL
        );

        displayAchievements();

    } catch (error) {

        console.error("Achievements Error:", error);

        gallery.innerHTML = "";

        const message = document.createElement("p");

        message.className = "loading-message";

        message.textContent =
            "Unable to load achievements. Please check your Google Sheet and Apps Script deployment.";

        gallery.appendChild(message);

        emptyMessage.style.display = "none";
    }
}

// ==========================================
// CREATE ACHIEVEMENT CARD
// ==========================================

function createCard(item) {

    const card = document.createElement("article");

    card.className = "achievement-card";

    const type = item.type.trim().toLowerCase();

    const url = safeURL(item.mediaURL);

    if (!url) return null;

    const mediaContainer = document.createElement("div");

    // PHOTO

    if (type === "photo") {

        const img = document.createElement("img");

        img.src = url;
        img.alt = item.title;
        img.className = "achievement-media";
        img.loading = "lazy";

        img.onerror = () => {
            img.alt = "Image unavailable";
            img.removeAttribute("src");
        };

        mediaContainer.appendChild(img);

    }

    // VIDEO

    else if (type === "video") {

        const embedURL = getYouTubeEmbed(url);

        if (embedURL) {

            const iframe = document.createElement("iframe");

            iframe.src = embedURL;
            iframe.className = "achievement-media";
            iframe.title = item.title;

            iframe.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

            iframe.allowFullscreen = true;

            mediaContainer.appendChild(iframe);

        }

        else if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {

            const video = document.createElement("video");

            video.src = url;
            video.controls = true;
            video.preload = "metadata";
            video.className = "achievement-media";

            mediaContainer.appendChild(video);

        }

        else {
            return null;
        }

    }

    // CERTIFICATE

    else if (type === "certificate") {

        const placeholder = document.createElement("div");

        placeholder.className =
            "achievement-media certificate-placeholder";

        placeholder.textContent = "📄 Certificate";

        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.fontSize = "25px";

        mediaContainer.appendChild(placeholder);

    }

    else {
        return null;
    }

    // CARD CONTENT

    const content = document.createElement("div");

    content.className = "achievement-content";

    const badge = document.createElement("span");

    badge.className = "achievement-type";

    badge.textContent = item.type;

    const title = document.createElement("h3");

    title.textContent = item.title;

    const description = document.createElement("p");

    description.textContent = item.description;

    content.append(badge, title, description);

    // DATE

    if (item.date) {

        const date = document.createElement("span");

        date.className = "achievement-date";

        date.textContent = item.date;

        content.appendChild(date);
    }

    // CERTIFICATE LINK

    if (type === "certificate") {

        const link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "certificate-link";

        link.textContent = "View Certificate";

        content.appendChild(link);
    }

    card.append(mediaContainer, content);

    return card;
}

// ==========================================
// DISPLAY ACHIEVEMENTS
// ==========================================

function displayAchievements() {

    gallery.innerHTML = "";

    const filtered = allAchievements.filter(item =>

        currentFilter === "All" ||

        item.type.trim().toLowerCase() ===
        currentFilter.toLowerCase()

    );

    let count = 0;

    filtered.forEach(item => {

        const card = createCard(item);

        if (card) {

            gallery.appendChild(card);

            count++;
        }
    });

    emptyMessage.style.display =
        count === 0 ? "block" : "none";
}

// ==========================================
// FILTER BUTTONS
// ==========================================

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn")
            .forEach(btn =>
                btn.classList.remove("active")
            );

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        displayAchievements();

    });

});

// ==========================================
// INITIAL LOAD
// ==========================================

loadAchievements();

// ==========================================
// AUTOMATIC UPDATE EVERY 60 SECONDS
// ==========================================

setInterval(loadAchievements, 60000);
