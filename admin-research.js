import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";



/* =========================================================
   RESEARCH GOOGLE SHEET
========================================================= */

const RESEARCH_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1lefFazuwoY6hxn7Sa3Ro6TCB58Yckyu5VFa-RSs9y5g/edit?gid=0#gid=0";



/* =========================================================
   AUTHORIZED RESEARCH ADMINS
========================================================= */

const ADMIN_EMAILS = [

     "bhivraj.iitd@gmail.com",
     "nextgenlab1234@gmail.com"
];



/* =========================================================
   ELEMENTS
========================================================= */

const loginButton =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");



/* =========================================================
   LOGIN
========================================================= */

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



        /* =================================================
           VALIDATION
        ================================================= */

        if (email === "" || password === "") {

            message.textContent =
                "Please enter email and password.";

            message.style.color = "red";

            return;
        }



        try {

            /* =============================================
               SHOW LOGIN STATUS
            ============================================= */

            message.textContent =
                "Logging in...";

            message.style.color =
                "#555";

            loginButton.disabled =
                true;



            /* =============================================
               FIREBASE LOGIN
            ============================================= */

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
                "Research admin login:",
                loggedInEmail
            );



            /* =============================================
               CHECK ADMIN EMAIL
            ============================================= */

            const isAdmin =
                ADMIN_EMAILS
                    .map(function (adminEmail) {

                        return adminEmail
                            .toLowerCase();

                    })
                    .includes(loggedInEmail);



            if (!isAdmin) {

                message.textContent =
                    "You are not authorized as a research admin.";

                message.style.color =
                    "red";

                loginButton.disabled =
                    false;

                return;
            }



            /* =============================================
               LOGIN SUCCESS
            ============================================= */

            message.textContent =
                "Login successful! Opening Research Sheet...";

            message.style.color =
                "green";



            /* =============================================
               OPEN GOOGLE SHEET
            ============================================= */

            setTimeout(function () {

                window.location.href =
                    RESEARCH_SHEET_URL;

            }, 700);


        } catch (error) {

            console.error(
                "Research admin login error:",
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