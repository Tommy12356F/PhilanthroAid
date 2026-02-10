import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { auth, db } from "../../firebase"
import { createDonation } from "../../services/donationService"

type Donation = {
  id: string
  category: string
  quantity: string
  condition: "new" | "good" | "used"
  description: string
  status: "open" | "matched"
}

type View = "dashboard" | "donate" | "history"

export default function DonorDashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [view, setView] = useState<View>("dashboard")
  const [pending, setPending] = useState<Donation[]>([])
  const [completed, setCompleted] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [category, setCategory] =
    useState<"food" | "clothes" | "books" | "other">("food")
  const [quantity, setQuantity] = useState("")
  const [condition, setCondition] =
    useState<"new" | "good" | "used">("good")
  const [description, setDescription] = useState("")

  // 🔐 Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
  }, [])

  // 🔁 Fetch donations whenever dashboard is active
  useEffect(() => {
    if (!uid || view !== "dashboard" && view !== "history") return

    const fetchDonations = async () => {
      setLoading(true)

      const q = query(
        collection(db, "donations"),
        where("donorId", "==", uid)
      )

      const snap = await getDocs(q)

      const all = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))

      setPending(all.filter((d) => d.status === "open"))
      setCompleted(all.filter((d) => d.status === "matched"))

      setLoading(false)
    }

    fetchDonations()
  }, [uid, view])

  // 📍 Get browser location
  const getLocation = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject()
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => reject()
      )
    })

  // ➕ Create donation
  const submitDonation = async () => {
    if (!uid) return
    if (!quantity.trim() || !description.trim()) {
      alert("Please fill all fields")
      return
    }

    let pickupLocation = { lat: 0, lng: 0 }
    try {
      pickupLocation = await getLocation()
    } catch {
      alert("Location permission required")
      return
    }

    await createDonation({
      donorId: uid,
      category,
      quantity,
      condition,
      description,
      city: "TEST_CITY",
      pickupLocation,
    })

    setQuantity("")
    setDescription("")
    setView("dashboard") // triggers refetch
  }

  // 🔓 Logout
  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  // 🧨 DEV reset
  const resetRegistration = async () => {
    if (!uid) return
    if (!window.confirm("DEV ONLY: Reset registration?")) return

    await deleteDoc(doc(db, "donors", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  return (
    <div className="flex min-h-screen w-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-[260px] shrink-0 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-semibold mb-8">PhilanthroAid</h1>

        <nav className="flex flex-col gap-2">
          {(["dashboard", "donate", "history"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-left px-4 py-2 rounded-lg ${
                view === v ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {v === "dashboard"
                ? "Dashboard"
                : v === "donate"
                ? "Donate Items"
                : "My History"}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-white/10 py-2 rounded"
          >
            Logout
          </button>
          <button
            onClick={resetRegistration}
            className="w-full bg-red-900/60 py-2 rounded text-red-300"
          >
            Reset (DEV)
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 w-full p-10 overflow-x-hidden">
        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <h2 className="text-3xl mb-1">Welcome back 👋</h2>
            <p className="text-white/60 mb-8">
              Track your ongoing donations and impact.
            </p>

            <h3 className="text-xl mb-4">Active Donation Units</h3>

            {loading ? (
              <p>Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-white/50">No active donations.</p>
            ) : (
              <div className="space-y-4 w-full">
                {pending.map((d) => (
                  <DonationCard key={d.id} donation={d} />
                ))}
              </div>
            )}
          </>
        )}

        {/* DONATE */}
        {view === "donate" && (
          <div className="w-full max-w-xl">
            <h2 className="text-2xl mb-6">New Donation</h2>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="input"
              >
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
                <option value="books">Books</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Quantity">
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Condition">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="input"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="used">Used</option>
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none"
                rows={3}
              />
            </Field>

            <button
              onClick={submitDonation}
              className="mt-4 bg-white text-black px-6 py-2 rounded"
            >
              Submit Donation
            </button>
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <>
            <h2 className="text-3xl mb-6">Donation History</h2>

            {completed.length === 0 ? (
              <p className="text-white/50">No completed donations.</p>
            ) : (
              <div className="space-y-4 w-full">
                {completed.map((d) => (
                  <DonationCard key={d.id} donation={d} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* ───────────────────────── */

function DonationCard({ donation }: { donation: Donation }) {
  const color =
    donation.status === "open"
      ? "bg-yellow-400 shadow-yellow-400/50"
      : "bg-green-400 shadow-green-400/50"

  return (
    <div className="w-full bg-white/5 p-6 rounded-2xl flex justify-between items-center">
      <div>
        <p className="font-medium capitalize">{donation.category}</p>
        <p className="text-sm text-white/60">
          {donation.quantity} · {donation.condition}
        </p>
        <p className="text-sm text-white/50 mt-1">
          {donation.description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${color} shadow-lg`}
        />
        <span className="text-sm capitalize">
          {donation.status}
        </span>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block mb-4">
      {label}
      {children}
    </label>
  )
}
