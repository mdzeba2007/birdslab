
import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ========================================
// ADMIN EMAILS
// ========================================

const ADMIN_EMAILS = [

    "nextgenlab1234@gmail.com",
    "bhivraj.iitd@gmail.com"
];


// ========================================
// GOOGLE SHEET
// ========================================

const MEMBERS_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1ZcoQ8yr_ZFnhcJfPvuGOixC6oK_dwOqHpceLAm2eATM/edit?gid=0#gid=0";


// ========================================
// HTML ELEMENTS
// ========================================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginBtn");
const message = document.getElementById("message");


// ========================================
// LOGIN
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
                "You are not authorized to edit the member directory.";

            message.style.color = "red";
            loginButton.disabled = false;
            return;
        }

        message.textContent = "Login successful! Opening Google Sheet...";
        message.style.color = "green";

        window.location.href = MEMBERS_SHEET_URL;

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