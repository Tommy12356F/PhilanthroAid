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
 * status:
 *  - open    → pending, not picked by NGO
 *  - matched → picked/completed by NGO
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
    status: "open",               // 🔴 IMPORTANT
    createdAt: serverTimestamp(),
  })

  return ref.id
}

/**
 * Fetch OPEN donations for NGOs (city-based)
 * Used in NGO dashboard
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
 * Marks donation as matched (completed from donor POV)
 */
export async function acceptDonation(
  donationId: string,
  ngoId: string
) {
  await updateDoc(doc(db, "donations", donationId), {
    status: "matched",             // 🔴 IMPORTANT
    matchedNgoId: ngoId,
    matchedAt: serverTimestamp(),
  })
}

/* =====================================================
   NEW HELPERS (FOR DONOR DASHBOARD + HISTORY)
   ===================================================== */

/**
 * Fetch donor's OPEN donations
 * Used in Donor Dashboard (active orders)
 */
export async function getDonorOpenDonations(donorId: string) {
  const q = query(
    collection(db, "donations"),
    where("donorId", "==", donorId),
    where("status", "==", "open")
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

/**
 * Fetch donor's MATCHED donations
 * Used in Donor History
 */
export async function getDonorMatchedDonations(donorId: string) {
  const q = query(
    collection(db, "donations"),
    where("donorId", "==", donorId),
    where("status", "==", "matched")
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}
