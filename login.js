
import { auth } from "./firebase2.js";

console.log("NEW LOGIN.JS IS RUNNING");

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const loginButton = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginButton.addEventListener("click", async function () {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        message.textContent = "Please enter email and password.";
        return;
    }

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.log("LOGIN SUCCESS:", userCredential.user.email);

        // Allow both admin accounts
        if (
            userCredential.user.email !== "mdzeba2007@gmail.com" &&
            userCredential.user.email !== "nextgenlab1234@gmail.com"
        ) {
            message.textContent = "You are not authorized as admin.";
            return;
        }

        message.textContent = "Login successful!";

        console.log("REDIRECTING TO ADMIN2");

        window.location.href = "./admin2.html";

    } catch (error) {

        console.error("LOGIN ERROR:", error.code, error.message);

        message.textContent = "Invalid email or password.";
    }

});
