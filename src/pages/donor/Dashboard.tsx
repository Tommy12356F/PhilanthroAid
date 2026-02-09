import { signOut } from "firebase/auth"
import { deleteDoc, doc } from "firebase/firestore"
import { auth, db } from "../../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"

export default function DonorDashboard() {
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  const resetRegistration = async () => {
    if (!uid) return

    const confirmReset = window.confirm(
      "DEV ONLY: This will reset your registration and log you out. Continue?"
    )
    if (!confirmReset) return

    // delete donor profile + user profile
    await deleteDoc(doc(db, "donors", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Donor Dashboard</h1>

      <p>
        Welcome to the Donor dashboard.
        <br />
        (Donation features coming next)
      </p>

      <hr style={{ margin: "40px 0" }} />

      <h3>⚠️ Dev Tools</h3>

      <button onClick={handleLogout}>
        Logout
      </button>

      <br /><br />

      <button onClick={resetRegistration} style={{ color: "red" }}>
        Reset Registration (DEV)
      </button>
    </div>
  )
}
