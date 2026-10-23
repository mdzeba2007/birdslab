import { auth } from "./firebase2.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


console.log(
    "PUBLICATIONS FIREBASE PROJECT:",
    auth.app.options.projectId
);


const loginButton =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


const ADMIN_EMAILS = [

     "bhivraj.iitd@gmail.com",
    "nextgenlab1234@gmail.com"

];


const PUBLICATIONS_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1TtI9ameanz3d5bQUIVZ24d3C9aBykpKT4KtgrefsSDc/edit?gid=0#gid=0";


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

            loginButton.disabled =
                true;


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
                "Publications admin login:",
                loggedInEmail
            );


            const isAdmin =
                ADMIN_EMAILS
                    .map(function (adminEmail) {

                        return adminEmail
                            .toLowerCase();

                    })
                    .includes(loggedInEmail);


            if (!isAdmin) {

                message.textContent =
                    "You are not authorized as a publications admin.";

                message.style.color =
                    "red";

                loginButton.disabled =
                    false;

                return;

            }


            message.textContent =
                "Login successful! Opening publications sheet...";

            message.style.color =
                "green";


            setTimeout(
                function () {

                    window.location.href =
                        PUBLICATIONS_SHEET_URL;

                },
                700
            );

        }


        catch (error) {

            console.error(
                "Publications login error:",
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