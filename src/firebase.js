// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "...", // 아까 쓰던 키 복사
    authDomain: "...",
    projectId: "christmas-table",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);