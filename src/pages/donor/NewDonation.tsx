import { useState } from "react"
import { auth } from "../../firebase"
import { createDonation } from "../../services/donationService"

export default function NewDonation() {
  const [category, setCategory] = useState<"food" | "clothes" | "books" | "other">("food")
  const [condition, setCondition] = useState<"new" | "good" | "used">("good")
  const [desc, setDesc] = useState("")
  const [qty, setQty] = useState("")

  const submit = async () => {
    const user = auth.currentUser
    if (!user) {
      alert("Not logged in")
      return
    }

    // get location on submit
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await createDonation({
        donorId: user.uid,
        category,
        condition, // ✅ THIS FIXES THE ERROR
        description: desc,
        quantity: qty,
        city: "TEST_CITY", // later derive from coords
        pickupLocation: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        },
      })

      alert("Donation created ✅")
      window.location.href = "/donor/dashboard"
    })
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>New Donation</h1>

      {/* CATEGORY */}
      <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
        <option value="food">Food</option>
        <option value="clothes">Clothes</option>
        <option value="books">Books</option>
        <option value="other">Other</option>
      </select>

      <br /><br />

      {/* CONDITION */}
      <select value={condition} onChange={(e) => setCondition(e.target.value as any)}>
        <option value="new">New</option>
        <option value="good">Good</option>
        <option value="used">Used</option>
      </select>

      <br /><br />

      {/* DESCRIPTION */}
      <input
        placeholder="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <br /><br />

      {/* QUANTITY */}
      <input
        placeholder="Quantity"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />

      <br /><br />

      <button onClick={submit}>Submit Donation</button>
    </div>
  )
}
