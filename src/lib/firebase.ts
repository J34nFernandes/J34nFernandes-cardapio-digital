// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "product-manager-cao46",
  appId: "1:892347949325:web:2fa65ff5d59f1d42195044",
  storageBucket: "product-manager-cao46.appspot.com",
  apiKey: "AIzaSyD8g4W-NfG3mzVN4Ay1ChGaOIfMzYe3y-Q",
  authDomain: "product-manager-cao46.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "892347949325"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
