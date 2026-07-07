// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase config object from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAA1jFUzkoroxr6Dg4opV_pxqbBKW2xnnY",
  authDomain: "test-db-f6315.firebaseapp.com",
  projectId: "test-db-f6315",
  storageBucket: "test-db-f6315.firebasestorage.app",
  messagingSenderId: "166750781296",
  appId: "1:166750781296:web:4b7e3437c7db9201ca59b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };