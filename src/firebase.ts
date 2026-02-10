

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCoVS97KdIFvNgWxa8zewN01Bwzc1EEygE",
  authDomain: "philanthroaid-c694e.firebaseapp.com",
  projectId: "philanthroaid-c694e",
  storageBucket: "philanthroaid-c694e.appspot.com",
  messagingSenderId: "246129043945",
  appId: "1:246129043945:web:2ef41f5e3aff98896fc378",
  // your config
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
