import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"
import { auth, db } from "../../firebase"

type LocationState = {
  lat: number
  lng: number
  city: string
}

export default function DonorRegister() {
  const [uid, setUid] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<LocationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 🔹 Bootstrap user
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUid(user.uid)

      const userRef = doc(db, "users", user.uid)
      const snap = await getDoc(userRef)

      // Returning user → go straight to dashboard
      if (snap.exists() && snap.data().profileCompleted) {
        window.location.href = "/donor/dashboard"
        return
      }

      // First-time user → create shell if missing
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          role: "donor",
          profileCompleted: false,
          createdAt: serverTimestamp(),
        })
      }

      setLoading(false)
    })
  }, [])

  // 🔹 Get browser location
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: "Unknown",
        })
      },
      () => alert("Location permission denied")
    )
  }

  // 🔹 Submit registration
  const submitRegistration = async () => {
    if (!uid || !name.trim() || !location) {
      alert("All required fields missing")
      return
    }

    setSaving(true)

    const donorId = `DONOR-${uid.slice(0, 6).toUpperCase()}`

    await setDoc(doc(db, "donors", uid), {
      donorId,
      uid,
      name,
      description,
      location,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, "users", uid), {
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    })

    window.location.href = "/donor/dashboard"
  }

  // 🔹 Logout
  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <h1>Donor Registration</h1>

      <input
        placeholder="Name (required)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={getLocation}>
        {location ? "Location Added ✅" : "Get Location"}
      </button>

      <br /><br />

      <button onClick={submitRegistration} disabled={saving}>
        {saving ? "Saving..." : "Continue"}
      </button>

      <br /><br />

      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
