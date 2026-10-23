import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =====================================================
// EVENTS ADMIN
// =====================================================

console.log(
    "EVENTS FIREBASE PROJECT:",
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
    "mdzeba2007@gmail.com",
    "nextgenlab1234@gmail.com",
     "bhivraj.iitd@gmail.com"
];


// =====================================================
// EVENTS GOOGLE SHEET
// =====================================================

const EVENTS_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1BOVmSNEFLVJLF3Wkxxf2ZF3Ss7WojiO631M8mDlc7wo/edit?gid=0#gid=0";


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
                "Events admin login:",
                loggedInEmail
            );


            // -------------------------------------------------
            // CHECK ADMIN
            // -------------------------------------------------

            const isAdmin =
                ADMIN_EMAILS
                    .map(function (adminEmail) {

                        return adminEmail
                            .toLowerCase();

                    })
                    .includes(
                        loggedInEmail
                    );


            if (!isAdmin) {

                message.textContent =
                    "You are not authorized as an events admin.";

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
                "Login successful! Opening events sheet...";

            message.style.color =
                "green";


            // -------------------------------------------------
            // OPEN GOOGLE SHEET
            // -------------------------------------------------

            setTimeout(
                function () {

                    window.location.href =
                        EVENTS_SHEET_URL;

                },
                700
            );


        } catch (error) {

            console.error(
                "Events login error:",
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