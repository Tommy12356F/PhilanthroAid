import { useEffect, useState } from "react"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { deleteDoc, doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase"
import { getOpenDonationsByCity } from "../../services/donationService"
import { createMatch } from "../../services/matchService"

interface Donation {
  id: string
  donorId: string
  category: string
  city: string
}

export default function NgoDashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Bootstrap NGO dashboard
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/"
        return
      }

      setUid(user.uid)

      // 🔹 Read user doc (source of truth)
      const userSnap = await getDoc(doc(db, "users", user.uid))
      if (!userSnap.exists()) {
        window.location.href = "/"
        return
      }

      const userData = userSnap.data()

      // 🔁 Wrong role → redirect (DON'T block)
      if (userData.role !== "ngo") {
        window.location.href = `/${userData.role}/dashboard`
        return
      }

      // 🚫 Profile incomplete → register
      if (!userData.profileCompleted) {
        window.location.href = "/ngo/register"
        return
      }

      // 🔹 Fetch NGO profile
      const ngoSnap = await getDoc(doc(db, "ngos", user.uid))
      if (!ngoSnap.exists()) {
        alert("NGO profile missing")
        return
      }

      const ngoData = ngoSnap.data()
      const ngoCity = ngoData.location?.city

      if (!ngoCity) {
        alert("NGO city not set")
        return
      }

      setCity(ngoCity)

      // 🔹 Fetch open donations for city
      const openDonations = await getOpenDonationsByCity(ngoCity)
      setDonations(openDonations as Donation[])

      setLoading(false)
    })
  }, [])

  // 🔹 Accept donation
  const handleAccept = async (donation: Donation) => {
    if (!uid || !city) return

    await createMatch({
      donationId: donation.id,
      donorId: donation.donorId,
      ngoId: uid,
      city,
    })

    // Remove from UI immediately
    setDonations((prev) => prev.filter((d) => d.id !== donation.id))
  }

  // 🔹 Logout
  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  // 🔹 DEV reset
  const resetRegistration = async () => {
    if (!uid) return

    const confirmReset = window.confirm(
      "DEV ONLY: This will reset your registration and log you out. Continue?"
    )
    if (!confirmReset) return

    await deleteDoc(doc(db, "ngos", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>NGO Dashboard</h1>

      <p>Open donations in your city:</p>

      {donations.length === 0 && <p>No open donations right now.</p>}

      <ul>
        {donations.map((d) => (
          <li key={d.id}>
            {d.category} — {d.city}
            <button
              style={{ marginLeft: 10 }}
              onClick={() => handleAccept(d)}
            >
              Accept
            </button>
          </li>
        ))}
      </ul>

      <hr style={{ margin: "40px 0" }} />

      <h3>⚠️ Dev Tools</h3>

      <button onClick={handleLogout}>Logout</button>

      <br /><br />

      <button onClick={resetRegistration} style={{ color: "red" }}>
        Reset Registration (DEV)
      </button>
    </div>
  )
}
