import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ========================================
// SETTINGS
// ========================================

const ADMIN_EMAILS = [
     "bhivraj.iitd@gmail.com",
    "nextgenlab1234@gmail.com"
];

const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbz89GhOCt2J-EJ59n29JTttKq0IB7t2weWpC0rjxGULq8NtLp8zecN3nlm05LCQXKa_pg/exec";


// ========================================
// ELEMENTS
// ========================================

const loginSection =
    document.getElementById("loginSection");

const dashboard =
    document.getElementById("dashboard");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const pendingProfiles =
    document.getElementById("pendingProfiles");


// ========================================
// CHECK ADMIN EMAIL
// ========================================

function isAdmin(user) {
    return Boolean(
        user &&
        user.email &&
        ADMIN_EMAILS.includes(
            user.email.toLowerCase()
        )
    );
}


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
        .getElementById("adminEmail")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("adminPassword")
        .value;

    loginMessage.textContent = "";

    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
    } catch (error) {
        console.error(error);

        loginMessage.textContent =
            "Invalid email or password.";
    }
});


// ========================================
// AUTH CHECK
// ========================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        loginSection.style.display = "block";
        dashboard.style.display = "none";
        return;
    }

    // Check whether the logged-in email is an admin.

    if (!isAdmin(user)) {
        await signOut(auth);

        loginSection.style.display = "block";
        dashboard.style.display = "none";

        loginMessage.textContent =
            "You are not authorized.";

        return;
    }

    // Admin is authorized.

    loginSection.style.display = "none";
    dashboard.style.display = "block";

    loadPendingProfiles();
});


// ========================================
// LOAD PENDING PROFILES
// ========================================

async function loadPendingProfiles() {
    pendingProfiles.innerHTML =
        "<p>Loading profiles...</p>";

    try {
        const response = await fetch(
            GOOGLE_SHEET_API + "?type=pending"
        );

        if (!response.ok) {
            throw new Error("Failed to load profiles.");
        }

        const profiles = await response.json();

        pendingProfiles.innerHTML = "";

        if (
            !Array.isArray(profiles) ||
            profiles.length === 0
        ) {
            pendingProfiles.innerHTML = `
                <div class="no-members">
                    No pending profiles.
                </div>
            `;
            return;
        }

        profiles.forEach((profile) => {
            createPendingCard(profile);
        });

    } catch (error) {
        console.error(error);

        pendingProfiles.innerHTML = `
            <p>Unable to load profiles.</p>
        `;
    }
}


// ========================================
// CREATE PENDING CARD
// ========================================

function createPendingCard(profile) {
    const card = document.createElement("div");

    card.className = "admin-profile-card";

    const name =
        profile["Full Name"] ||
        profile["Name"] ||
        "Unnamed";

    const education =
        profile["Education"] || "";

    const research =
        profile["Research"] ||
        profile["Research / Interests"] ||
        "";

    const experience =
        profile["Experience"] || "";

    const email =
        profile["Email"] || "";

    const linkedin =
        profile["LinkedIn"] ||
        profile["LinkedIn Profile"] ||
        "";

    card.innerHTML = `
        <h3>${escapeHTML(name)}</h3>

        ${
            email
                ? `<p>
                    <strong>Email:</strong>
                    ${escapeHTML(email)}
                   </p>`
                : ""
        }

        ${
            education
                ? `<p>
                    <strong>Education:</strong>
                    ${escapeHTML(education)}
                   </p>`
                : ""
        }

        ${
            research
                ? `<p>
                    <strong>Research:</strong>
                    ${escapeHTML(research)}
                   </p>`
                : ""
        }

        ${
            experience
                ? `<p>
                    <strong>Experience:</strong>
                    ${escapeHTML(experience)}
                   </p>`
                : ""
        }

        ${
            linkedin
                ? `<p>
                    <strong>LinkedIn:</strong>
                    <a
                        href="${escapeAttribute(linkedin)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View LinkedIn
                    </a>
                   </p>`
                : ""
        }

        <div class="admin-actions">
            <button class="approve-button" type="button">
                Approve
            </button>

            <button class="delete-button" type="button">
                Delete
            </button>
        </div>
    `;

    // APPROVE

    card.querySelector(".approve-button")
        .addEventListener("click", () => {
            updateProfile(profile._row, "approve");
        });

    // DELETE

    card.querySelector(".delete-button")
        .addEventListener("click", () => {
            updateProfile(profile._row, "delete");
        });

    pendingProfiles.appendChild(card);
}


// ========================================
// APPROVE / DELETE
// ========================================

async function updateProfile(row, action) {
    const user = auth.currentUser;

    if (!isAdmin(user)) {
        alert("Unauthorized.");
        return;
    }

    if (
        action !== "approve" &&
        action !== "delete"
    ) {
        alert("Invalid action.");
        return;
    }

    if (
        action === "delete" &&
        !confirm("Delete this profile?")
    ) {
        return;
    }

    try {
        const response = await fetch(
            GOOGLE_SHEET_API,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({
                    email: user.email,
                    row: row,
                    action: action
                })
            }
        );

        if (!response.ok) {
            throw new Error("Request failed.");
        }

        const result = await response.json();

        if (!result.success) {
            alert(
                result.message ||
                "Unable to update profile."
            );
            return;
        }

        alert(
            action === "approve"
                ? "Profile approved!"
                : "Profile deleted!"
        );

        loadPendingProfiles();

    } catch (error) {
        console.error(error);

        alert("Something went wrong.");
    }
}


// ========================================
// LOGOUT
// ========================================

document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
        await signOut(auth);
    });


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// ESCAPE ATTRIBUTE
// ========================================

function escapeAttribute(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}