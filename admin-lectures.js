
import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =====================================================
// LAB ACHIEVEMENTS ADMIN
// =====================================================

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
// LOGIN
// =====================================================

loginButton.addEventListener(
    "click",
    async function () {

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


        // -------------------------------------------------
        // EMPTY FIELDS
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

            message.textContent =
                "Logging in...";

            message.style.color =
                "#555";

            loginButton.disabled = true;


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
                )
                .toLowerCase();


            console.log(
                "Lab Achievements admin login:",
                loggedInEmail
            );


            // -------------------------------------------------
            // CHECK ADMIN
            // -------------------------------------------------

            const isAdmin =
                ADMIN_EMAILS
                    .map(function (adminEmail) {

                        return adminEmail.toLowerCase();

                    })
                    .includes(
                        loggedInEmail
                    );


            if (!isAdmin) {

                message.textContent =
                    "You are not authorized as a Lab Achievements admin.";

                message.style.color =
                    "red";

                loginButton.disabled =
                    false;

                return;
            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            message.textContent =
                "Login successful! Opening Lab Achievements sheet...";

            message.style.color =
                "green";


            // -------------------------------------------------
            // OPEN GOOGLE SHEET
            // -------------------------------------------------

            setTimeout(
                function () {

                    window.location.href =
                        ACHIEVEMENTS_SHEET_URL;

                },
                700
            );


        } catch (error) {

            console.error(
                "Lab Achievements login error:",
                error.code,
                error.message
            );


            message.textContent =
                "Invalid email or password.";

            message.style.color =
                "red";


            loginButton.disabled =
                false;
        }

    }
);
