import { useState } from "react"
import heroImg from "../assets/hero.jpg"
import sideImg from "../assets/side.jpg"
import { loginWithGoogle } from "../auth"

export default function Landing() {
  const [role, setRole] = useState<"donor" | "ngo" | null>(null)

  return (
    <>
      {/* =========================
          SECTION 1 — HERO (LOCKED)
      ========================== */}
      <div className="min-h-screen w-screen bg-[#231C1A] flex items-center justify-center">
        <div className="relative h-[93vh] w-[95vw] rounded-[30px] overflow-hidden">
          
          {/* IMAGE */}
          <img
            src={heroImg}
            alt="Hero"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* TEXT */}
          <h1
            className="
              absolute inset-0
              flex items-center justify-center
              text-white
              text-[180px]
              font-italiana
              z-10
            "
          >
            PhilanthroAid
          </h1>
        </div>
      </div>

      {/* =========================
          SECTION 2 — WELCOME
      ========================== */}
      <section className="h-[90vh] w-screen bg-[#231C1A] flex items-center justify-center font-bricolage">
        <div className="w-[95vw] h-[80vh] grid grid-cols-[7fr_3fr] gap-3">

          {/* LEFT — CONTENT (70%) */}
          <div className="rounded-[20px] bg-black/40 backdrop-blur-md p-12 flex flex-col justify-between text-white">

            {/* TEXT */}
            <div className="space-y-6">
              <h2 className="text-7xl font-semibold">Welcome!</h2>

              <p className="text-[22px] leading-relaxed text-white/80 max-w-xl">
                Turning everyday donations into a transparent, location-aware
                supply network that intelligently matches surplus goods to real
                NGO needs, reduces waste, and delivers measurable social impact
                at scale.
              </p>
            </div>

            {/* ROLE TOGGLE */}
            <div className="space-y-4">
              <p className="text-[32px] font-medium">I’m a:</p>

              <div className="flex gap-8">
                {/* DONOR */}
                <button
                  onClick={() => setRole("donor")}
                  className={`w-[270px] py-4 rounded-2xl border transition-all duration-300
                    ${
                      role === "donor"
                        ? "bg-[#FFEFD5] text-black scale-[1.03] shadow-lg"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                >
                  👥 Donor
                </button>

                {/* NGO */}
                <button
                  onClick={() => setRole("ngo")}
                  className={`w-[270px] py-4 rounded-2xl border transition-all duration-300 
                    ${
                      role === "ngo"
                        ? "bg-[#FFEFD5] text-black scale-[1.03] shadow-lg"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                >
                  🤝 NGO
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8 border-t border-white/20">
              <button
                disabled={!role}
                onClick={() => {
                  if (role) {
                    localStorage.setItem("role", role)
                    loginWithGoogle()
                  }
                }}
                className={`w-[320px] py-4 rounded-xl font-semibold transition
                  ${
                    role
                      ? "bg-white text-black hover:scale-[1.01]"
                      : "bg-white/40 text-black/50 cursor-not-allowed"
                  }`}
              >
                Continue with Google
              </button>
            </div>
          </div>

          {/* RIGHT — IMAGE (30%) */}
          <div
            className="relative rounded-[20px] bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url(${sideImg})` }}
          >
            <div className="absolute bottom-4 font-italiana right-6 text-white text-sm opacity-80">
              PhilanthroAid
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
