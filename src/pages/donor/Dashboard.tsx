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

/* ───────────────────── TYPES ───────────────────── */

type DonationStatus = "open" | "matched" | "completed"

type Donation = {
  id: string
  category: string
  quantity: string
  condition: "new" | "good" | "used"
  description: string
  status: DonationStatus
}

type Request = {
  id: string
  category: string
  quantity: string
  urgency: "low" | "medium" | "high"
  description: string
  fulfilled: boolean
  ngoId: string
}

type View = "dashboard" | "donate" | "history" | "requests"

/* ───────────────────── COMPONENT ───────────────────── */

export default function DonorDashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [view, setView] = useState<View>("dashboard")

  const [pending, setPending] = useState<Donation[]>([])
  const [matched, setMatched] = useState<Donation[]>([])
  const [completed, setCompleted] = useState<Donation[]>([])
  const [requests, setRequests] = useState<Request[]>([])

  const [loading, setLoading] = useState(true)

  /* ---------- Donate form ---------- */
  const [category, setCategory] =
    useState<"food" | "clothes" | "books" | "other">("food")
  const [quantity, setQuantity] = useState("")
  const [condition, setCondition] =
    useState<"new" | "good" | "used">("good")
  const [description, setDescription] = useState("")

  /* ---------- Auth ---------- */
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
  }, [])

  /* ---------- Fetch DONATIONS ---------- */
  useEffect(() => {
    if (!uid || (view !== "dashboard" && view !== "history")) return

    const run = async () => {
      setLoading(true)

      const q = query(
        collection(db, "donations"),
        where("donorId", "==", uid)
      )

      const snap = await getDocs(q)
      const all: Donation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))

      setPending(all.filter((d) => d.status === "open"))
      setMatched(all.filter((d) => d.status === "matched"))
      setCompleted(all.filter((d) => d.status === "completed"))

      setLoading(false)
    }

    run()
  }, [uid, view])

  /* ---------- Fetch REQUESTS (for donors) ---------- */
  useEffect(() => {
    if (!uid || view !== "requests") return

    const run = async () => {
      const q = query(
        collection(db, "requests"),
        where("fulfilled", "==", false)
      )

      const snap = await getDocs(q)
      setRequests(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      )
    }

    run()
  }, [uid, view])

  /* ---------- Geolocation ---------- */
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

  /* ---------- Create Donation ---------- */
  const submitDonation = async () => {
    if (!uid || !quantity.trim() || !description.trim()) {
      alert("Fill all fields")
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
    setView("dashboard")
  }

  /* ---------- Logout / Reset ---------- */
  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  const resetRegistration = async () => {
    if (!uid) return
    if (!confirm("DEV ONLY: Reset registration?")) return

    await deleteDoc(doc(db, "donors", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  /* ───────────────────── UI ───────────────────── */

  return (
    <div className="flex min-h-screen w-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-[260px] shrink-0 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-semibold mb-8">PhilanthroAid</h1>

        <nav className="flex flex-col gap-2">
          <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")}>
            Dashboard
          </NavButton>
          <NavButton active={view === "donate"} onClick={() => setView("donate")}>
            Donate Items
          </NavButton>
          <NavButton active={view === "history"} onClick={() => setView("history")}>
            My History
          </NavButton>
          <NavButton active={view === "requests"} onClick={() => setView("requests")}>
            NGO Requests
          </NavButton>
        </nav>

        <div className="mt-auto space-y-3">
          <button onClick={logout} className="w-full bg-white/10 py-2 rounded">
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

            <h3 className="text-xl mb-4">Active Donations</h3>

            {loading ? (
              <p>Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-white/50">No active donations.</p>
            ) : (
              <div className="space-y-4">
                {pending.map((d) => (
                  <DonationCard key={d.id} donation={d} />
                ))}
              </div>
            )}
          </>
        )}

        {/* DONATE */}
        {view === "donate" && (
          <div className="max-w-xl">
            <h2 className="text-2xl mb-6">New Donation</h2>

            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="input">
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
                <option value="books">Books</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Quantity">
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
            </Field>

            <Field label="Condition">
              <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="input">
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

            <button onClick={submitDonation} className="bg-white text-black px-6 py-2 rounded">
              Submit Donation
            </button>
          </div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <>
            <h2 className="text-3xl mb-6">Donation History</h2>

            <div className="space-y-6">
              {matched.map((d) => (
                <DonationCard key={d.id} donation={d} />
              ))}
              {completed.map((d) => (
                <DonationCard key={d.id} donation={d} />
              ))}
            </div>
          </>
        )}

        {/* REQUESTS */}
        {view === "requests" && (
          <>
            <h2 className="text-3xl mb-6">NGO Requests</h2>

            {requests.length === 0 ? (
              <p className="text-white/50">No active requests.</p>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {requests.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* ───────────────────── COMPONENTS ───────────────────── */

function DonationCard({ donation }: { donation: Donation }) {
  const color =
    donation.status === "completed"
      ? "bg-green-400 shadow-green-400/50"
      : donation.status === "matched"
      ? "bg-yellow-400 shadow-yellow-400/50"
      : "bg-gray-400"

  return (
    <div className="bg-white/5 p-6 rounded-2xl flex justify-between items-center">
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
        <span className={`h-3 w-3 rounded-full ${color} shadow-lg`} />
        <span className="text-sm capitalize">{donation.status}</span>
      </div>
    </div>
  )
}

function RequestCard({ request }: { request: Request }) {
  const urgencyColor =
    request.urgency === "high"
      ? "text-red-400"
      : request.urgency === "medium"
      ? "text-yellow-400"
      : "text-green-400"

  return (
    <div className="bg-white/5 p-6 rounded-2xl">
      <p className="font-medium capitalize">{request.category}</p>
      <p className="text-sm text-white/60">
        Quantity needed: {request.quantity}
      </p>
      <p className={`text-sm mt-1 ${urgencyColor}`}>
        Urgency: {request.urgency}
      </p>
      <p className="text-xs text-white/50 mt-2">
        {request.description}
      </p>
    </div>
  )
}

function NavButton({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-left ${
        active ? "bg-white/10" : "hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: any) {
  return (
    <label className="block mb-4">
      <p className="text-sm mb-1 text-white/70">{label}</p>
      {children}
    </label>
  )
}
