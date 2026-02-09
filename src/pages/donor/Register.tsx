import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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

  // Get logged-in user
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
      setLoading(false)
    })
  }, [])

  // Get browser location
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
          city: "Unknown", // can be improved later
        })
      },
      () => alert("Location permission denied")
    )
  }

  // Save donor profile
  const submitRegistration = async () => {
    if (!uid) return
    if (!name.trim()) {
      alert("Name is required")
      return
    }
    if (!location) {
      alert("Please allow location access")
      return
    }

    setSaving(true)

    const donorId = `DONOR-${uid.slice(0, 6).toUpperCase()}`

    // Save donor profile
    await setDoc(doc(db, "donors", uid), {
      donorId,
      uid,
      name,
      description,
      location,
      createdAt: serverTimestamp(),
    })

    // Mark profile complete
    await updateDoc(doc(db, "users", uid), {
      profileCompleted: true,
    })

    // Redirect to dashboard
    window.location.href = "/donor/dashboard"
  }

  // Logout (testing + safety)
  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <h1>Donor Registration</h1>

      <label>
        Name (required)
        <br />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <br /><br />

      <label>
        Description (optional)
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short note about you"
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

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}
