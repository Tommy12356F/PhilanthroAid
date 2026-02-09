import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export const bootstrapUser = async (
  uid: string,
  email: string,
  role: "donor" | "ngo"
) => {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)

  // First-time login
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      email,
      role,
      profileCompleted: false,
      createdAt: serverTimestamp(),
    })

    return { role, profileCompleted: false }
  }

  // Returning user
  const data = snap.data()
  return {
    role: data.role,
    profileCompleted: data.profileCompleted,
  }
}
