
import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =====================================================
// LAB ACHIEVEMENTS ADMIN
// =====================================================

console.log("ACHIEVEMENTS JS FILE LOADED");

console.log(
    "ACHIEVEMENTS FIREBASE PROJECT:",
    auth.app.options.projectId
);


// =====================================================
// HTML ELEMENTS
// =====================================================

const loginButton =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

console.log("LOGIN BUTTON:", loginButton);
console.log("MESSAGE ELEMENT:", message);


// =====================================================
// CHECK HTML ELEMENTS
// =====================================================

if (!loginButton || !message || !emailInput || !passwordInput) {

    console.error(
        "ERROR: One or more HTML elements are missing. Check element IDs."
    );

} else {

    console.log("All HTML elements found.");

}


// =====================================================
// ADMIN EMAILS
// =====================================================

const ADMIN_EMAILS = [
    "nextgenlab1234@gmail.com",
    "bhivraj.iitd@gmail.com"
];


// =====================================================
// LAB ACHIEVEMENTS GOOGLE SHEET
// =====================================================

const ACHIEVEMENTS_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1Sket6UKE6VOuClrbq0UfgYJNlpkDqsX6C-CtE09OvGY/edit?gid=0#gid=0";


// =====================================================
// LOGIN BUTTON
// =====================================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            console.log("LOGIN BUTTON CLICKED");


            // -------------------------------------------------
            // GET INPUT VALUES
            // -------------------------------------------------

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            console.log("Entered email:", email);


            // -------------------------------------------------
            // CHECK EMPTY FIELDS
            // -------------------------------------------------

            if (
                email === "" ||
                password === ""
            ) {

                message.textContent =
                    "Please enter email and password.";

                message.style.color = "red";

                return;
            }


            try {

                // -------------------------------------------------
                // LOGIN STARTED
                // -------------------------------------------------

                message.textContent =
                    "Logging in...";

                message.style.color =
                    "#555";

                loginButton.disabled = true;


                console.log("Firebase login started.");


                // -------------------------------------------------
                // FIREBASE LOGIN
                // -------------------------------------------------

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const loggedInEmail =
                    (
                        userCredential.user.email || ""
                    ).toLowerCase();


                console.log(
                    "Lab Achievements admin login:",
                    loggedInEmail
                );


                // -------------------------------------------------
                // CHECK ADMIN EMAIL
                // -------------------------------------------------

                const isAdmin =
                    ADMIN_EMAILS
                        .map(function (adminEmail) {

                            return adminEmail.toLowerCase();

                        })
                        .includes(loggedInEmail);


                if (!isAdmin) {

                    message.textContent =
                        "You are not authorized as a Lab Achievements admin.";

                    message.style.color =
                        "red";

                    loginButton.disabled = false;

                    return;
                }


                // -------------------------------------------------
                // LOGIN SUCCESS
                // -------------------------------------------------

                console.log(
                    "Lab Achievements admin verified."
                );

                message.textContent =
                    "Login successful! Opening Lab Achievements sheet...";

                message.style.color =
                    "green";


                // -------------------------------------------------
                // OPEN GOOGLE SHEET
                // -------------------------------------------------

                console.log(
                    "Opening Google Sheet:",
                    ACHIEVEMENTS_SHEET_URL
                );

                window.location.href =
                    ACHIEVEMENTS_SHEET_URL;


            } catch (error) {

                // -------------------------------------------------
                // ERROR
                // -------------------------------------------------

                console.error(
                    "Lab Achievements login error:",
                    error.code,
                    error.message
                );

                message.textContent =
                    error.code + ": " + error.message;

                message.style.color =
                    "red";

                loginButton.disabled = false;

            }

        }
    );

}


// =====================================================
// PRESS ENTER TO LOGIN
// =====================================================

if (passwordInput && loginButton) {

    passwordInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                loginButton.click();

            }

        }
    );

}
