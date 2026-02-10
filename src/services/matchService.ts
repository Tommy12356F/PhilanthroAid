import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

/**
 * NGO accepts a donation → creates a match
 */
export async function createMatch(data: {
  donationId: string
  donorId: string
  ngoId: string
  city: string
}) {
  // 1. Create match record
  const matchRef = await addDoc(collection(db, "matches"), {
    ...data,
    status: "active",
    createdAt: serverTimestamp(),
  })

  // 2. Update donation status
  await updateDoc(doc(db, "donations", data.donationId), {
    status: "matched",
    matchedNgoId: data.ngoId,
    matchId: matchRef.id,
    updatedAt: serverTimestamp(),
  })

  return matchRef.id
}

/**
 * Mark donation as completed
 */
export async function completeMatch(matchId: string, donationId: string) {
  await updateDoc(doc(db, "matches", matchId), {
    status: "completed",
    completedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, "donations", donationId), {
    status: "completed",
    updatedAt: serverTimestamp(),
  })
}
