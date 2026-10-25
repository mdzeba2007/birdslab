import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =====================================================
// CHECK FIREBASE PROJECT
// =====================================================

console.log(
    "EQUIPMENT FIREBASE PROJECT:",
    auth.app.options.projectId
);


// =====================================================
// GET HTML ELEMENTS
// =====================================================

const loginButton =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


// =====================================================
// ADMIN EMAILS
// =====================================================

const ADMIN_EMAILS = [
   
    "nextgenlab1234@gmail.com",
     "bhivraj.iitd@gmail.com"
];


// =====================================================
// GOOGLE SHEET
// =====================================================

const EQUIPMENT_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1oyNAFxbFdNJbfN34sN10FNpWUQPHuiLOF8HsUETo0CU/edit";


// =====================================================
// LOGIN BUTTON
// =====================================================

loginButton.addEventListener("click", async function () {

    const email =
        document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("password")
            .value;


    // =================================================
    // CHECK EMPTY FIELDS
    // =================================================

    if (email === "" || password === "") {

        message.textContent =
            "Please enter email and password.";

        message.style.color = "red";

        return;
    }


    // =================================================
    // LOGIN
    // =================================================

    try {

        message.textContent =
            "Logging in...";

        message.style.color =
            "#555";

        loginButton.disabled = true;


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const loggedInEmail =
            (userCredential.user.email || "")
                .toLowerCase();


        console.log(
            "Equipment admin login:",
            loggedInEmail
        );


        // =================================================
        // CHECK ADMIN EMAIL
        // =================================================

        const isAdmin =
            ADMIN_EMAILS
                .map(function (adminEmail) {
                    return adminEmail.toLowerCase();
                })
                .includes(loggedInEmail);


        if (!isAdmin) {

            message.textContent =
                "You are not authorized as an equipment admin.";

            message.style.color =
                "red";

            loginButton.disabled = false;

            return;
        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        message.textContent =
            "Login successful! Opening equipment sheet...";

        message.style.color =
            "green";


        console.log(
            "Equipment admin verified."
        );


        // =================================================
        // OPEN GOOGLE SHEET
        // =================================================

        setTimeout(function () {

            window.location.href =
                EQUIPMENT_SHEET_URL;

        }, 700);


    } catch (error) {

        console.error(
            "Equipment login error:",
            error.code,
            error.message
        );


        message.textContent =
            "Invalid email or password.";

        message.style.color =
            "red";

        loginButton.disabled = false;

    }

});