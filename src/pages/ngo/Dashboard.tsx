import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"
import { auth, db } from "../../firebase"

/* ---------------- Types ---------------- */

type Donation = {
  id: string
  category: string
  quantity: string
  condition: "new" | "good" | "used"
  city: string
  description?: string
  status: "open" | "matched" | "completed"
  matchedNgoId?: string
}

type Request = {
  id: string
  category: string
  quantity: string
  urgency: "low" | "medium" | "high"
  description: string
  fulfilled: boolean
}

type View = "operations" | "available" | "my" | "request"

/* ---------------- Component ---------------- */

export default function NgoDashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [city] = useState("TEST_CITY")
  const [view, setView] = useState<View>("operations")

  const [available, setAvailable] = useState<Donation[]>([])
  const [myDonations, setMyDonations] = useState<Donation[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)

  /* ---------- Request form ---------- */
  const [reqCategory, setReqCategory] = useState("food")
  const [reqQuantity, setReqQuantity] = useState("")
  const [reqUrgency, setReqUrgency] = useState<"low" | "medium" | "high">(
    "medium"
  )
  const [reqDescription, setReqDescription] = useState("")

  /* ---------- Auth ---------- */
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
  }, [])

  /* ---------- Available Donations ---------- */
  useEffect(() => {
    if (!uid || view !== "available") return

    const run = async () => {
      setLoading(true)
      const q = query(
        collection(db, "donations"),
        where("status", "==", "open"),
        where("city", "==", city)
      )
      const snap = await getDocs(q)
      setAvailable(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      )
      setLoading(false)
    }

    run()
  }, [uid, view, city])

  /* ---------- My Donations (matched to this NGO) ---------- */
  useEffect(() => {
    if (!uid || view !== "operations" && view !== "my") return

    const run = async () => {
      const q = query(
        collection(db, "donations"),
        where("matchedNgoId", "==", uid)
      )
      const snap = await getDocs(q)
      setMyDonations(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      )
    }

    run()
  }, [uid, view])

  /* ---------- Requests ---------- */
  useEffect(() => {
    if (!uid || view !== "request") return

    const run = async () => {
      const q = query(
        collection(db, "requests"),
        where("ngoId", "==", uid)
      )
      const snap = await getDocs(q)
      setRequests(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      )
    }

    run()
  }, [uid, view])

  /* ---------- Actions ---------- */

  const acceptDonation = async (id: string) => {
    if (!uid) return
    await updateDoc(doc(db, "donations", id), {
      status: "matched",
      matchedNgoId: uid,
    })
    setAvailable((p) => p.filter((d) => d.id !== id))
  }

  const completeDonation = async (id: string) => {
    await updateDoc(doc(db, "donations", id), {
      status: "completed",
      completedAt: serverTimestamp(),
    })
    setMyDonations((p) => p.filter((d) => d.id !== id))
  }

  const submitRequest = async () => {
    if (!uid || !reqQuantity.trim()) return

    await addDoc(collection(db, "requests"), {
      ngoId: uid,
      category: reqCategory,
      quantity: reqQuantity,
      urgency: reqUrgency,
      description: reqDescription,
      fulfilled: false,
      createdAt: serverTimestamp(),
    })

    setReqQuantity("")
    setReqDescription("")
    setView("operations")
  }

  const resetDev = async () => {
    if (!uid) return
    if (!confirm("DEV ONLY: Reset NGO?")) return

    await deleteDoc(doc(db, "ngos", uid))
    await deleteDoc(doc(db, "users", uid))

    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen w-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-[260px] border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-semibold mb-8">PhilanthroAid</h1>

        <nav className="flex flex-col gap-2">
          <NavButton active={view === "operations"} onClick={() => setView("operations")}>
            Operations
          </NavButton>
          <NavButton active={view === "available"} onClick={() => setView("available")}>
            Available Donations
          </NavButton>
          <NavButton active={view === "my"} onClick={() => setView("my")}>
            My Donations
          </NavButton>
          <NavButton active={view === "request"} onClick={() => setView("request")}>
            Request Items
          </NavButton>
        </nav>

        <div className="mt-auto space-y-3">
          <button onClick={logout} className="w-full bg-white/10 py-2 rounded">
            Logout
          </button>
          <button
            onClick={resetDev}
            className="w-full bg-red-900/60 py-2 rounded text-red-300"
          >
            Reset (DEV)
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 px-12 py-10 max-w-none">
        {/* OPERATIONS */}
        {view === "operations" && (
          <>
            <h2 className="text-3xl mb-2">NGO Control Center</h2>
            <p className="text-white/60 mb-8">
              Manage intake logistics and critical needs
            </p>

            <div className="grid grid-cols-4 gap-6 mb-10">
              <Stat title="Matched Donations" value={myDonations.length} />
              <Stat
                title="Completed"
                value={myDonations.filter((d) => d.status === "completed").length}
              />
              <Stat title="Success Rate" value="94%" />
              <Stat title="Latency" value="12m" />
            </div>

            <h3 className="text-xl mb-4">Logistic Feed</h3>

            <div className="grid grid-cols-2 gap-6">
              {myDonations
                .filter((d) => d.status === "matched")
                .map((d) => (
                  <DonationCard key={d.id}>
                    <DonationInfo d={d} />
                    <button
                      onClick={() => completeDonation(d.id)}
                      className="text-green-400"
                    >
                      ✔ Complete
                    </button>
                  </DonationCard>
                ))}
            </div>
          </>
        )}

        {/* AVAILABLE */}
        {view === "available" && (
          <>
            <h2 className="text-3xl mb-6">Available Donations</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {available.map((d) => (
                  <DonationCard key={d.id}>
                    <DonationInfo d={d} />
                    <button
                      onClick={() => acceptDonation(d.id)}
                      className="text-green-400"
                    >
                      ✔ Accept
                    </button>
                  </DonationCard>
                ))}
              </div>
            )}
          </>
        )}

        {/* MY DONATIONS */}
        {view === "my" && (
          <>
            <h2 className="text-3xl mb-6">My Donations</h2>
            <div className="grid grid-cols-2 gap-6">
              {myDonations.map((d) => (
                <DonationCard key={d.id}>
                  <DonationInfo d={d} />
                  <span className="text-sm text-white/60 capitalize">
                    {d.status}
                  </span>
                </DonationCard>
              ))}
            </div>
          </>
        )}

        {/* REQUEST ITEMS */}
        {view === "request" && (
          <div className="max-w-md">
            <h2 className="text-2xl mb-6">Request Items</h2>

            <Input label="Category">
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value)}
                className="input"
              >
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
                <option value="books">Books</option>
                <option value="medical">Medical</option>
              </select>
            </Input>

            <Input label="Quantity">
              <input
                value={reqQuantity}
                onChange={(e) => setReqQuantity(e.target.value)}
                className="input"
              />
            </Input>

            <Input label="Urgency">
              <select
                value={reqUrgency}
                onChange={(e) => setReqUrgency(e.target.value as any)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Input>

            <Input label="Description">
              <textarea
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                className="input h-24"
              />
            </Input>

            <button
              onClick={submitRequest}
              className="bg-white text-black px-6 py-2 rounded"
            >
              Submit Request
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

/* ---------------- Components ---------------- */

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

function Stat({ title, value }: any) {
  return (
    <div className="bg-white/5 p-5 rounded-xl">
      <p className="text-sm text-white/60">{title}</p>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  )
}

function DonationCard({ children }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-xl flex justify-between items-center">
      {children}
    </div>
  )
}

function DonationInfo({ d }: { d: Donation }) {
  return (
    <div>
      <p className="text-lg font-medium capitalize">{d.category}</p>
      <p className="text-sm text-white/60">
        {d.quantity} · {d.condition}
      </p>
      {d.description && (
        <p className="text-xs text-white/40 mt-1">{d.description}</p>
      )}
    </div>
  )
}

function Input({ label, children }: any) {
  return (
    <label className="block mb-4">
      <p className="text-sm mb-1 text-white/70">{label}</p>
      {children}
    </label>
  )
}
