// src/services/geminiMatchService.ts

type Donation = {
  id: string
  category: string
  quantity: string
  description?: string
  pickupLocation?: { lat: number; lng: number }
  donorName?: string
}

type Request = {
  id: string
  category: string
  quantity: string
  urgency: "low" | "medium" | "high"
  description: string
}

type MatchResult = {
  donationId: string
  requestId: string
  score: number
  reasoning: string
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function generateMatches(
  donations: Donation[],
  requests: Request[]
): Promise<MatchResult[]> {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key missing")
    return []
  }

  const prompt = `
You are an AI logistics matcher for an NGO platform.

Goal:
Match each donation to the most relevant request.

Consider:
- Category similarity (highest priority)
- Quantity relevance
- Urgency (high > medium > low)
- Description semantic similarity
- Location proximity if available

Return STRICT JSON ONLY in this format:
[
  {
    "donationId": "string",
    "requestId": "string",
    "score": number (0-100),
    "reasoning": "short explanation"
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
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
    return JSON.parse(text)
  } catch (e) {
    console.error("Gemini parsing failed", e)
    return []
  }
}
