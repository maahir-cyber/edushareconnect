// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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