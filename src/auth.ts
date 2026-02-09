import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { auth } from "./firebase"

const provider = new GoogleAuthProvider()

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, provider)
}

export const logout = async () => {
  return signOut(auth)
}
