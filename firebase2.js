import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdLAXHOzClFig_Z6DqLIaJiVwMTkjBrMw",
  authDomain: "collage-calendar.firebaseapp.com",
  projectId: "collage-calendar",
  storageBucket: "collage-calendar.firebasestorage.app",
  messagingSenderId: "503890976417",
  appId: "1:503890976417:web:9401499122933510079ae0",
  measurementId: "G-0E2QVFJGSC"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };