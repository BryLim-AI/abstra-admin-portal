// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDr1D8s5pCeD7PHNv1TsDV5dx_GaNcI_PI",
    authDomain: "hestia-c0294.firebaseapp.com",
    projectId: "hestia-c0294",
    storageBucket: "hestia-c0294.firebasestorage.app",
    messagingSenderId: "81240939214",
    appId: "1:81240939214:web:1c6be5442d07f47f034e9f",
    measurementId: "G-FTP8C7GG2N"
};

// Initialize Firebase
let messaging;

if (typeof window !== "undefined") {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
}

export { messaging };