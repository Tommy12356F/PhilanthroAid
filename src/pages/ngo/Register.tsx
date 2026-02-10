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

export default function NgoRegister() {
  const [uid, setUid] = useState<string | null>(null)
  const [ngoName, setNgoName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<LocationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 🔹 Bootstrap + guard
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUid(user.uid)

      const userRef = doc(db, "users", user.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        window.location.href = "/"
        return
      }

      const userData = snap.data()

      // 🔁 If user is NOT NGO, redirect to their real dashboard
      if (userData.role !== "ngo") {
        window.location.href = `/${userData.role}/dashboard`
        return
      }

      // 🔁 If already registered, go to dashboard
      if (userData.profileCompleted) {
        window.location.href = "/ngo/dashboard"
        return
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
          city: "Unknown", // can improve later
        })
      },
      () => alert("Location permission denied")
    )
  }

  // 🔹 Save NGO profile
  const submitRegistration = async () => {
    if (!uid) return
    if (!ngoName.trim()) {
      alert("NGO name is required")
      return
    }
    if (!location) {
      alert("Please allow location access")
      return
    }

    setSaving(true)

    const ngoId = `NGO-${uid.slice(0, 6).toUpperCase()}`

    // Save NGO profile
    await setDoc(doc(db, "ngos", uid), {
      ngoId,
      uid,
      name: ngoName,
      description,
      location,
      createdAt: serverTimestamp(),
    })

    // Mark profile complete (role already set by bootstrap)
    await updateDoc(doc(db, "users", uid), {
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    })

    window.location.href = "/ngo/dashboard"
  }

  // 🔹 Logout (dev + safety)
  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <h1>NGO Registration</h1>

      <label>
        NGO Name (required)
        <br />
        <input
          value={ngoName}
          onChange={(e) => setNgoName(e.target.value)}
          placeholder="NGO name"
        />
      </label>

      <br /><br />

      <label>
        Description (optional)
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the NGO"
        />
      </label>

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
