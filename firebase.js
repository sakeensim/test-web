import { initializeApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAHNqNibl4hGMV7JQHF2kWDbpwMOabiyXo",
  authDomain: "workpal-f62ec.firebaseapp.com",
  projectId: "workpal-f62ec",
  storageBucket: "workpal-f62ec.firebasestorage.app",
  messagingSenderId: "1086538540695",
  appId: "1:1086538540695:web:7f55ce9356d7b9ab68abd2",
  measurementId: "G-0NW58W3Y61"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const googleProvider =
  new GoogleAuthProvider()