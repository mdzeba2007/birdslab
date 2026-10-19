import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyA40MoeUA6ZF5HKF16NO8BX-kwKVxJCeRA",

    authDomain: "birds-lab-c27a4.firebaseapp.com",

    projectId: "birds-lab-c27a4",

    storageBucket:
        "birds-lab-c27a4.firebasestorage.app",

    messagingSenderId: "406527125468",

    appId:
        "1:406527125468:web:37aed1fe2ba9c1f6229119",

    measurementId: "G-20WQPS40TZ"
};


// Initialize Firebase

const app =
    initializeApp(firebaseConfig);


// Firebase Authentication

const auth =
    getAuth(app);


// Firestore

const db =
    getFirestore(app);


// Export

export {
    app,
    auth,
    db
};