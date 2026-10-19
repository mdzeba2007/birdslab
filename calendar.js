
import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const monthYear = document.getElementById("month-year");
const daysContainer = document.getElementById("days");

const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const eventInfo = document.getElementById("event-info");


let currentDate = new Date();


// Store Firebase events
let events = [];


// GET EVENTS FROM FIREBASE
async function getEvents() {

    try {

        const snapshot = await getDocs(
            collection(db, "calendar")
        );

        events = [];

        snapshot.forEach(function (doc) {

            events.push(doc.data());

        });

        console.log("Events from Firebase:", events);

        generateCalendar();

    } catch (error) {

        console.error("Error getting events:", error);

    }
}


// GENERATE CALENDAR
function generateCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay =
        new Date(year, month, 1).getDay();

    const totalDays =
        new Date(year, month + 1, 0).getDate();


    const monthName =
        currentDate.toLocaleString("default", {
            month: "long"
        });


    monthYear.textContent =
        `${monthName} ${year}`;


    daysContainer.innerHTML = "";


    // Empty spaces
    for (let i = 0; i < firstDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.classList.add("empty");

        daysContainer.appendChild(emptyDay);
    }


    // Dates
    for (let day = 1; day <= totalDays; day++) {

        const dateElement =
            document.createElement("div");

        dateElement.classList.add("date");


        const monthNumber =
            String(month + 1).padStart(2, "0");

        const dayNumber =
            String(day).padStart(2, "0");


        const dateString =
            `${year}-${monthNumber}-${dayNumber}`;


        dateElement.textContent = day;


        // Check Firebase event
        const eventExists =
            events.some(function (event) {

                return event.date === dateString;

            });


        // Add red dot
        if (eventExists) {

            const dot =
                document.createElement("span");

            dot.classList.add("event-dot");

            dateElement.appendChild(dot);
        }


        // Click date
        dateElement.addEventListener("click", function () {

            showEvent(dateString);

        });


        // Highlight today
        const today = new Date();

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {

            dateElement.classList.add("today");

        }


        daysContainer.appendChild(dateElement);
    }
}


// SHOW EVENT
function showEvent(dateString) {

    const event =
        events.find(function (event) {

            return event.date === dateString;

        });


    if (!event) {

        eventInfo.innerHTML =
            "<p>No event on this date.</p>";

        return;
    }


    eventInfo.innerHTML = `

        <h3>${event.title}</h3>

        <p>📅 ${event.date}</p>

        <p>🕒 ${event.time || "Time not specified"}</p>

        <p>📍 ${event.location || "Location not specified"}</p>

        <p>${event.info}</p>

        <button id="show-more">
            Show more
        </button>

    `;


    // Show more button
    document
        .getElementById("show-more")
        .addEventListener("click", function () {

            alert(
                `Title: ${event.title}\n\n` +
                `Date: ${event.date}\n` +
                `Time: ${event.time}\n` +
                `Location: ${event.location}\n\n` +
                `Information: ${event.info}`
            );

        });

}


// PREVIOUS MONTH
prevButton.addEventListener("click", function () {

    currentDate.setMonth(
        currentDate.getMonth() - 1
    );

    generateCalendar();

});


// NEXT MONTH
nextButton.addEventListener("click", function () {

    currentDate.setMonth(
        currentDate.getMonth() + 1
    );

    generateCalendar();

});


// START
getEvents();