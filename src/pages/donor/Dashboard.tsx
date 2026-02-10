import { useEffect, useState } from "react"
import { auth } from "../../firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase"
import { signOut } from "firebase/auth"
import { createDonation } from "../../services/donationService"

type Tab = "dashboard" | "donate" | "history"

export default function DonorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [category, setCategory] = useState("food")
  const [condition, setCondition] = useState("good")
  const [quantity, setQuantity] = useState("")
  const [description, setDescription] = useState("")

  const user = auth.currentUser

  // 🔹 FETCH DONATIONS
  useEffect(() => {
    if (!user) return

    const fetch = async () => {
      const q = query(
        collection(db, "donations"),
        where("donorId", "==", user.uid)
      )

      const snap = await getDocs(q)
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }

    fetch()
  }, [user])

  // 🔹 CREATE DONATION
  const submitDonation = async () => {
    if (!user) return alert("Not logged in")

    navigator.geolocation.getCurrentPosition(async (pos) => {
      await createDonation({
        donorId: user.uid,
        category: category as any,
        condition: condition as any,
        quantity,
        description,
        city: "TEST_CITY",
        pickupLocation: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        },
      })

      setQuantity("")
      setDescription("")
      setActiveTab("dashboard")
    })
  }

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/10 p-6">
        <h1 className="text-2xl font-bold mb-10">PhilanthroAid</h1>

        <SidebarItem
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
          label="Dashboard"
        />
        <SidebarItem
          active={activeTab === "donate"}
          onClick={() => setActiveTab("donate")}
          label="Donate Items"
        />
        <SidebarItem
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          label="My History"
        />

        <button
          onClick={async () => {
            await signOut(auth)
            localStorage.clear()
            window.location.href = "/"
          }}
          className="mt-12 text-red-400"
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <h2 className="text-4xl font-semibold mb-2">
              Welcome back 👋
            </h2>
            <p className="text-white/50 mb-10">
              Here’s what’s happening with your donations
            </p>

            <div className="grid grid-cols-3 gap-6 mb-12">
              <Stat title="Total Donations" value={donations.length} />
              <Stat title="Active" value={donations.filter(d => d.status === "open").length} />
              <Stat title="Matched" value={donations.filter(d => d.status === "matched").length} />
            </div>

            <h3 className="text-xl mb-4">Active Donations</h3>

            {loading ? (
              <p>Loading…</p>
            ) : donations.length === 0 ? (
              <p className="text-white/40">No donations yet</p>
            ) : (
              <div className="space-y-4">
                {donations.map(d => (
                  <div
                    key={d.id}
                    className="p-6 rounded-xl bg-white/5 flex justify-between"
                  >
                    <div>
                      <p className="font-medium capitalize">{d.category}</p>
                      <p className="text-white/50 text-sm">
                        {d.quantity} • {d.condition}
                      </p>
                    </div>
                    <span className="text-yellow-400 text-sm">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DONATE */}
        {activeTab === "donate" && (
          <div className="max-w-lg">
            <h2 className="text-3xl mb-6">New Donation</h2>

            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>

            <select className="input mt-4" value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
            </select>

            <input
              className="input mt-4"
              placeholder="Quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />

            <textarea
              className="input mt-4"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <button
              onClick={submitDonation}
              className="mt-6 bg-white text-black px-6 py-3 rounded-xl"
            >
              Submit Donation
            </button>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <p className="text-white/50">History view coming next</p>
        )}
      </main>
    </div>
  )
}

/* ───────── helpers ───────── */

function SidebarItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-3 rounded-lg mb-2
        ${active ? "bg-white/10" : "hover:bg-white/5"}
      `}
    >
      {label}
    </button>
  )
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-6 rounded-xl bg-white/5">
      <p className="text-white/50 text-sm">{title}</p>
      <p className="text-3xl mt-2">{value}</p>
    </div>
  )
}
