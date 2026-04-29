import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDaWAOPDZeATTSL7kQ-CDkbFstyvpTMkNM",
    authDomain: "hr-poc-cdec5.firebaseapp.com",
    projectId: "hr-poc-cdec5",
    storageBucket: "hr-poc-cdec5.appspot.com",
    messagingSenderId: "348496003604",
    appId: "1:348496003604:web:5cb59a6f7851c5d0279d01",
    measurementId: "G-D9B88Z16TC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
