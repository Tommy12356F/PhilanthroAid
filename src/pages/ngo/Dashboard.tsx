import { signOut } from "firebase/auth"
import { deleteDoc, doc } from "firebase/firestore"
import { auth, db } from "../../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"

export default function NgoDashboard() {
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

    // delete NGO profile + user profile
    await deleteDoc(doc(db, "ngos", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NGO Dashboard</h1>

      <p>
        Welcome to the NGO dashboard.
        <br />
        (Needs & matching coming next)
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
