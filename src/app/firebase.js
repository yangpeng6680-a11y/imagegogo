import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBB7RqTFcuJFyNq2o7C6Oi_tJLaDb2eneA",
  authDomain: "imagegogo-d915b.firebaseapp.com",
  projectId: "imagegogo-d915b",
  storageBucket: "imagegogo-d915b.firebasestorage.app",
  messagingSenderId: "513906618740",
  appId: "1:513906618740:web:873a42a7c74a4b6810bc21",
  measurementId: "G-B1LX0XDXXL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut };
