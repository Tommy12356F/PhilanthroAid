import Landing from "./pages/Landing"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { auth } from "./firebase"
import { loginWithGoogle, logout } from "./auth"
import { bootstrapUser } from "./userBootstrap"

// pages
import NgoRegister from "./pages/ngo/Register"

import DonorRegister from "./pages/donor/Register"

import DonorDashboard from "./pages/donor/Dashboard"
import NgoDashboard from "./pages/ngo/Dashboard"



function AppRoutes() {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        navigate("/")   // 👈 THIS fixes the black screen
        return
      }

      const role = localStorage.getItem("role") as "ngo" | "donor"
      if (!role) {
        navigate("/")
        setLoading(false)
        return
      }

      const result = await bootstrapUser(user.uid, user.email!, role)

      if (!result.profileCompleted) {
        navigate(`/${result.role}/register`)
      } else {
        navigate(`/${result.role}/dashboard`)
      }

      setLoading(false)
    })
  }, [navigate])


  if (loading) return <p>Loading...</p>

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ngo/register" element={<NgoRegister />} />
      <Route path="/ngo/dashboard" element={<NgoDashboard />} />
      <Route path="/donor/register" element={<DonorRegister />} />
      <Route path="/donor/dashboard" element={<DonorDashboard />} />
    </Routes>

  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
