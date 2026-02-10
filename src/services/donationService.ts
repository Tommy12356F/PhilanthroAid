import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

/**
 * Create a new donation (Donor action)
 */
export async function createDonation(data: {
  donorId: string
  category: "food" | "clothes" | "books" | "other"
  condition: "new" | "good" | "used"
  description: string
  quantity: string
  city: string
  pickupLocation: { lat: number; lng: number }
}) {
  const ref = await addDoc(collection(db, "donations"), {
    ...data,
    status: "open",
    createdAt: serverTimestamp(),
  })

  return ref.id
}


/**
 * Fetch open donations for NGOs (city-based)
 */
export async function getOpenDonationsByCity(city: string) {
  const q = query(
    collection(db, "donations"),
    where("city", "==", city),
    where("status", "==", "open")
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

/**
 * NGO accepts a donation
 */
export async function acceptDonation(
  donationId: string,
  ngoId: string
) {
  await updateDoc(doc(db, "donations", donationId), {
    status: "matched",
    matchedNgoId: ngoId,
    updatedAt: serverTimestamp(),
  })
}
