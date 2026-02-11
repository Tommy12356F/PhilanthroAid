// src/services/geminiMatchService.ts

/* ───────────────── TYPES ───────────────── */

export type GeminiDonation = {
  id: string
  category: string
  quantity: string
  description?: string
  pickupLocation?: { lat: number; lng: number }
  donorName?: string
}

export type GeminiRequest = {
  id: string
  category: string
  quantity: string
  urgency: "low" | "medium" | "high"
  description: string
}

export type GeminiMatch = {
  donationId: string
  requestId: string
  reason: string
}

/* ───────────────── CONFIG ───────────────── */

// ⚠️ DEV ONLY — you explicitly asked for this
const GEMINI_API_KEY = "AIzaSyDPGRATX1bCFA1yXYNgFPgq9x2rGiZ7G7E"

/* ───────────────── FUNCTION ───────────────── */

export async function runGeminiMatching(
  donations: GeminiDonation[],
  requests: GeminiRequest[]
): Promise<GeminiMatch[]> {
  if (!donations.length || !requests.length) {
    console.warn("Gemini: No data to match")
    return []
  }

  const prompt = `
You are an AI logistics matcher for an NGO platform.

TASK:
Match the most relevant donation to each request.

PRIORITIES:
1. Category match (highest)
2. Quantity relevance
3. Urgency (high > medium > low)
4. Semantic similarity in description
5. Location proximity if available

RETURN STRICT JSON ONLY:
[
  {
    "donationId": "string",
    "requestId": "string",
    "reason": "short explanation"
  }
]

DATA:

DONATIONS:
${JSON.stringify(donations, null, 2)}

REQUESTS:
${JSON.stringify(requests, null, 2)}
`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  const data = await res.json()

  try {
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"

    const parsed = JSON.parse(rawText)

    if (!Array.isArray(parsed)) return []

    // ✅ Normalize output
    return parsed.map((m) => ({
      donationId: m.donationId,
      requestId: m.requestId,
      reason: m.reason ?? m.reasoning ?? "Matched by Gemini",
    }))
  } catch (err) {
    console.error("❌ Gemini parse failed:", err)
    return []
  }
}
