import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { runGeminiMatching } from "../../services/geminiMatchService"

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

/* ================= TYPES ================= */

type Donation = {
  id: string
  category: string
  quantity: string
  condition: "new" | "good" | "used"
  city: string
  description?: string
  status: "open" | "matched" | "completed"
  matchedNgoId?: string
  donorName?: string
  pickupLocation?: { lat: number; lng: number }
}
type GeminiMatch = {
  donationId: string
  requestId: string
  score: number
  reasoning: string
}

type Request = {
  id: string
  category: string
  quantity: string
  urgency: "low" | "medium" | "high"
  description: string
  fulfilled: boolean
}

type View = "operations" | "available" | "my" | "request" | "matches"

/* ================= COMPONENT ================= */

export default function NgoDashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [city] = useState("TEST_CITY")
  const [view, setView] = useState<View>("operations")

  const [available, setAvailable] = useState<Donation[]>([])
  const [myDonations, setMyDonations] = useState<Donation[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [, setLoading] = useState(false)

  /* ---------- Request form ---------- */
  const [reqCategory, setReqCategory] = useState("food")
  const [reqQuantity, setReqQuantity] = useState("")
  const [reqUrgency, setReqUrgency] =
    useState<"low" | "medium" | "high">("medium")
  const [reqDescription, setReqDescription] = useState("")
  /* ---------- Gemini State ---------- */
  const [geminiMatches, setGeminiMatches] = useState<GeminiMatch[]>([])
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiError, setGeminiError] = useState<string | null>(null)


  /* ================= AUTH ================= */


  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
  }, [])

  /* ================= FETCH DATA ================= */

  // AVAILABLE DONATIONS
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
      setAvailable(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      setLoading(false)
    }

    run()
  }, [uid, view, city])

  // MY DONATIONS (matched + completed)
  useEffect(() => {
    if (!uid || (view !== "operations" && view !== "my")) return

    const run = async () => {
      const q = query(
        collection(db, "donations"),
        where("matchedNgoId", "==", uid)
      )
      const snap = await getDocs(q)
      setMyDonations(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    }

    run()
  }, [uid, view])

  // REQUESTS
  useEffect(() => {
    if (!uid || (view !== "request" && view !== "operations")) return

    const run = async () => {
      const q = query(
        collection(db, "requests"),
        where("ngoId", "==", uid)
      )
      const snap = await getDocs(q)
      setRequests(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    }

    run()
  }, [uid, view])

  /* ================= ACTIONS ================= */

  const acceptDonation = async (id: string) => {
    if (!uid) return
    await updateDoc(doc(db, "donations", id), {
      status: "matched",
      matchedNgoId: uid,
    })
    setAvailable(p => p.filter(d => d.id !== id))
  }

  const completeDonation = async (id: string) => {
    await updateDoc(doc(db, "donations", id), {
      status: "completed",
      completedAt: serverTimestamp(),
    })
    setMyDonations(p => p.map(d => d.id === id ? { ...d, status: "completed" } : d))
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

  const toggleRequestFulfilled = async (id: string, value: boolean) => {
    await updateDoc(doc(db, "requests", id), { fulfilled: value })
    setRequests(p =>
      p.map(r => r.id === id ? { ...r, fulfilled: value } : r)
    )
  }
  /* ---------- Gemini Matching ---------- */
  const runGemini = async () => {
    setGeminiLoading(true)
    setGeminiError(null)
    setGeminiMatches([])

    try {
      // 1. Fetch open donations
      const donationSnap = await getDocs(
        query(collection(db, "donations"), where("status", "==", "open"))
      )

      // 2. Fetch unfulfilled requests
      const requestSnap = await getDocs(
        query(collection(db, "requests"), where("fulfilled", "==", false))
      )

      const donations = donationSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      }))

      const requests = requestSnap.docs.map(r => ({
        id: r.id,
        ...(r.data() as any),
      }))

      if (donations.length === 0 || requests.length === 0) {
        setGeminiError("No open donations or requests to match")
        return
      }

      // 3. Run Gemini
      const matches = await runGeminiMatching(donations, requests)

      setGeminiMatches(matches)
    } catch (err) {
      console.error(err)
      setGeminiError("Gemini failed to generate matches")
    } finally {
      setGeminiLoading(false)
    }
  }


  /* ================= DEV ================= */

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

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen w-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside className="w-[280px] border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-semibold mb-8">PhilanthroAid</h1>

        <nav className="flex flex-col gap-2">
          {[
            ["operations", "Operations"],
            ["available", "Available Donations"],
            ["my", "My Donations"],
            ["request", "Request Items"],
            ["matches", "Matches"],
          ].map(([k, v]) => (
            <NavButton key={k} active={view === k} onClick={() => setView(k as View)}>
              {v}
            </NavButton>
          ))}
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
              <Stat title="Matched Donations" value={myDonations.filter(d => d.status === "matched").length} />
              <Stat title="Completed" value={myDonations.filter(d => d.status === "completed").length} />
              <Stat title="Active Requests" value={requests.filter(r => !r.fulfilled).length} />
              <Stat title="Latency" value="12m" />
            </div>

            <h3 className="text-xl mb-4">Requests Overview</h3>
            <div className="grid grid-cols-2 gap-6">
              {requests.map(r => (
                <Card key={r.id}>
                  <div>
                    <p className="font-medium capitalize">{r.category}</p>
                    <p className="text-sm text-white/60">
                      {r.quantity} · {r.urgency}
                    </p>
                    <p className="text-xs text-white/40 mt-1">{r.description}</p>
                  </div>
                  <button
                    onClick={() => toggleRequestFulfilled(r.id, !r.fulfilled)}
                    className={r.fulfilled ? "text-green-400" : "text-white/40"}
                  >
                    ✔
                  </button>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* AVAILABLE DONATIONS */}
        {view === "available" && (
          <>
            <h2 className="text-3xl mb-6">Available Donations</h2>
            <div className="grid grid-cols-2 gap-6">
              {available.map(d => (
                <Card key={d.id}>
                  <DonationInfo d={d} />
                  <button onClick={() => acceptDonation(d.id)} className="text-green-400">
                    ✔ Accept
                  </button>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* MY DONATIONS */}
        {view === "my" && (
          <>
            <h2 className="text-3xl mb-6">My Donations</h2>
            <div className="grid grid-cols-2 gap-6">
              {myDonations.map(d => (
                <Card key={d.id} highlight={d.status === "completed"}>
                  <DonationInfo d={d} />
                  {d.status === "matched" ? (
                    <button onClick={() => completeDonation(d.id)} className="text-green-400">
                      ✔ Complete
                    </button>
                  ) : (
                    <span className="text-green-500">Completed ✓</span>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* REQUEST */}
        {view === "request" && (
          <div className="max-w-md">
            <h2 className="text-2xl mb-6">Request Items</h2>
            <Input label="Category">
              <select className="input" value={reqCategory} onChange={e => setReqCategory(e.target.value)}>
                <option>food</option>
                <option>clothes</option>
                <option>books</option>
                <option>medical</option>
              </select>
            </Input>
            <Input label="Quantity">
              <input className="input" value={reqQuantity} onChange={e => setReqQuantity(e.target.value)} />
            </Input>
            <Input label="Urgency">
              <select className="input" value={reqUrgency} onChange={e => setReqUrgency(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Input>
            <Input label="Description">
              <textarea className="input h-24" value={reqDescription} onChange={e => setReqDescription(e.target.value)} />
            </Input>
            <button onClick={submitRequest} className="bg-white text-black px-6 py-2 rounded">
              Submit Request
            </button>
          </div>
        )}

        {/* MATCHES */}
          {view === "matches" && (
            <>
              <h2 className="text-3xl mb-4">AI-Suggested Matches</h2>
              <p className="text-white/60 mb-6">
                Read-only AI pairing of donations ↔ requests
              </p>

              <button
                onClick={runGemini}
                disabled={geminiLoading}
                className="mb-6 bg-white text-black px-6 py-2 rounded"
              >
                {geminiLoading ? "Matching..." : "Run Gemini Matching"}
              </button>

              {geminiError && (
                <p className="text-red-400 mb-4">{geminiError}</p>
              )}

              {geminiMatches.length === 0 && !geminiLoading ? (
                <p className="text-white/40">No matches generated yet.</p>
              ) : (
                <div className="space-y-8">
                  {geminiMatches.map((m, idx) => {
                    const donation = available.find(d => d.id === m.donationId)
                    const request = requests.find(r => r.id === m.requestId)

                    return (
                      <div key={idx} className="grid grid-cols-2 gap-6">
                        {/* REQUEST */}
                        <div className="bg-white/5 p-6 rounded-xl">
                          <p className="text-xs text-white/40 mb-1">REQUEST</p>
                          <p className="font-medium capitalize">{request?.category}</p>
                          <p className="text-sm text-white/60">
                            Qty: {request?.quantity} · {request?.urgency}
                          </p>
                          <p className="text-xs text-white/40 mt-2">
                            {request?.description}
                          </p>
                        </div>

                        {/* DONATION */}
                        <div className="bg-white/5 p-6 rounded-xl">
                          <p className="text-xs text-white/40 mb-1">DONATION</p>
                          <p className="font-medium capitalize">{donation?.category}</p>
                          <p className="text-sm text-white/60">
                            Qty: {donation?.quantity} · {donation?.condition}
                          </p>
                          <p className="text-xs text-white/40 mt-2">
                            {donation?.description}
                          </p>
                        </div>

                        {/* REASON */}
                        <div className="col-span-2 text-xs text-white/50">
                          <strong>Why:</strong> {m.reasoning} (Score: {m.score})
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

      </main>
    </div>
  )
}

/* ================= UI HELPERS ================= */

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

function Card({ children, highlight }: any) {
  return (
    <div
      className={`p-6 rounded-xl flex justify-between items-center ${
        highlight ? "bg-green-900/20 border border-green-500/30" : "bg-white/5"
      }`}
    >
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
      {d.donorName && (
        <p className="text-xs text-white/40 mt-1">
          Donor: {d.donorName}
        </p>
      )}
      {d.pickupLocation && (
        <p className="text-xs text-white/30 mt-1">
          {d.pickupLocation.lat}, {d.pickupLocation.lng}
        </p>
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
