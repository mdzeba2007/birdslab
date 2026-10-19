import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ========================================
// AUTHORIZED ADMIN EMAILS
// ========================================

const ADMIN_EMAILS = [
    "mdzeba2007@gmail.com",
    "nextgenlab1234@gmail.com"
];


// ========================================
// GOOGLE SHEET RESPONSES LINK
// Replace with your Google Form Responses Sheet URL
// ========================================

const RESPONSES_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/14YuEELwFVYtECc0dHi1wFxYSzLmOXL82r7u7kkdgOes/edit?usp=sharing";


// ========================================
// HTML ELEMENTS
// ========================================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginBtn");
const message = document.getElementById("message");


// ========================================
// LOGIN HANDLER
// ========================================

loginButton.addEventListener("click", async function () {

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        message.style.color = "red";
        return;
    }

    loginButton.disabled = true;
    message.textContent = "Logging in...";
    message.style.color = "#555";

    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = credential.user;
        const loggedInEmail = (user.email || "").toLowerCase();

        if (!ADMIN_EMAILS.includes(loggedInEmail)) {
            await signOut(auth);

            message.textContent =
                "You are not authorized to view enrollment responses.";

            message.style.color = "red";
            loginButton.disabled = false;
            return;
        }

        message.textContent = "Login successful! Opening responses Google Sheet...";
        message.style.color = "green";

        // Redirect directly to the responses Google Sheet
        window.location.href = RESPONSES_SHEET_URL;

    } catch (error) {
        console.error("Admin login error:", error.code, error.message);

        message.textContent = "Invalid email or password.";
        message.style.color = "red";
        loginButton.disabled = false;
    }
});


// ========================================
// PRESS ENTER TO LOGIN
// ========================================

passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        loginButton.click();
    }
});