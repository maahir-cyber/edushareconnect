// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1yfHn5CiqMzjunCQ-y6VjPEkWmk5Bs00",
  authDomain: "edushareconnect-cef72.firebaseapp.com",
  projectId: "edushareconnect-cef72",
  storageBucket: "edushareconnect-cef72.firebasestorage.app",
  messagingSenderId: "961572219344",
  appId: "1:961572219344:web:ae708a716621fa96c4f1d5",
  measurementId: "G-RMK6RYNVMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Firestore database for cross-device syncing
export const db = getFirestore(app);