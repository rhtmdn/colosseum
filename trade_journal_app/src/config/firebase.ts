import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBgU1GG_aIbq_ronL5GZ5VETd4DiLotMVM",
    authDomain: "colosseum-a7f03.firebaseapp.com",
    projectId: "colosseum-a7f03",
    storageBucket: "colosseum-a7f03.firebasestorage.app",
    messagingSenderId: "875852338322",
    appId: "1:875852338322:web:c04548a5dce6fd1872c24b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
