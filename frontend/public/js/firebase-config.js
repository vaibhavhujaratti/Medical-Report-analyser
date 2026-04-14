import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQFhPrnXeK1-UMEn-znFbiOJabNZzMfWs",
  authDomain: "medicalreportanalyser.firebaseapp.com",
  projectId: "medicalreportanalyser",
  storageBucket: "medicalreportanalyser.firebasestorage.app",
  messagingSenderId: "1028162206052",
  appId: "1:1028162206052:web:f4ff8c3d43b2bfb693a271",
  measurementId: "G-E6Z403CKBG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
