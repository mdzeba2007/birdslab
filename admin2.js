import { db, auth } from "./firebase2.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ================================
// AUTHORIZED ADMINS
// ================================

const ADMIN_EMAILS = [
    "mdzeba2007@gmail.com",
    "nextgenlab1234@gmail.com"
];


// ================================
// CHECK ADMIN LOGIN
// ================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        // Not logged in
        window.location.href = "login.html";

        return;
    }

    // Check if logged-in user is an admin
    const isAdmin = ADMIN_EMAILS
        .map(email => email.toLowerCase())
        .includes((user.email || "").toLowerCase());

    if (!isAdmin) {

        alert("You are not authorized as admin.");

        signOut(auth);

        return;
    }

});


// ================================
// GET FORM
// ================================

const eventForm = document.getElementById("event-form");

const eventDate =
    document.getElementById("event-date");

const eventTitle =
    document.getElementById("event-title");

const eventDescription =
    document.getElementById("event-description");

const eventTime =
    document.getElementById("event-time");

const eventLocation =
    document.getElementById("event-location");

const logoutBtn =
    document.getElementById("logoutBtn");


// ================================
// SAVE EVENT
// ================================

eventForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const date = eventDate.value;

    const title =
        eventTitle.value.trim();

    const description =
        eventDescription.value.trim();

    const time =
        eventTime.value;

    const location =
        eventLocation.value.trim();


    // Check required fields

    if (
        date === "" ||
        title === "" ||
        description === ""
    ) {

        alert(
            "Please fill in Date, Title and Information."
        );

        return;
    }


    try {

        // Save to Firestore

        await setDoc(
            doc(db, "calendar", date),
            {
                date: date,
                title: title,
                info: description,
                time: time,
                location: location,
                status: "open"
            }
        );


        alert(
            "Event saved successfully to Firebase!"
        );


        // Clear form

        eventForm.reset();


    } catch (error) {

        console.error(
            "Firebase error:",
            error
        );

        alert(
            "Error saving event. Check the Console."
        );

    }

});


// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener("click", async function () {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

});