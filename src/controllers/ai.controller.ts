import { Request, Response } from "express"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string

type GenerateBody = {
  role?: string
  experience?: string
  education?: string
  type?: "technical" | "behavioral" | "mixed"
}

export const generateAiQuestions = async (req: Request, res: Response) => {
  try {
    const { role, experience, education, type }: GenerateBody = req.body || {}
    console.log("AI request body:", req.body)

    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY")
      return res.status(500).json({ message: "AI key not configured" })
    }

    const profileParts: string[] = []
    if (role) profileParts.push(`Role: ${role}`)
    if (experience) profileParts.push(`Experience: ${experience}`)
    if (education) profileParts.push(`Education: ${education}`)

    const profileText = profileParts.length ? profileParts.join("; ") : "General software engineer"
    const typeText = type || "mixed"

    const prompt = `You are an interview coach. Generate 20 ${typeText} interview questions as a numbered list for this candidate profile: ${profileText}. Return only the questions, one per line.`

    type GeminiPart = { text?: string }
    type GeminiContent = { parts?: GeminiPart[] }
    type GeminiCandidate = { content?: GeminiContent | GeminiContent[] }
    type GeminiApiResponse = { candidates?: GeminiCandidate[] }

    let aiResponse
    try {
      aiResponse = await axios.post<GeminiApiResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1024
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 40000
        }
      )

    } catch (apiErr: any) {
      console.error("Gemini API error:", {
        message: apiErr.message,
        status: apiErr.response?.status,
        data: apiErr.response?.data
      })

      const errorMessage = apiErr.response?.data?.error?.message || apiErr.message || "Gemini API request failed";
      return res.status(apiErr.response?.status || 500).json({ message: errorMessage });
    }

    const candidate = aiResponse.data?.candidates?.[0]
    if (!candidate) {
      console.error("No candidates returned from Gemini:", aiResponse.data)
      return res.status(502).json({ message: "AI did not return any candidates." })
    }

    const content = candidate.content
    let rawText = ""

    if (Array.isArray(content)) {
      rawText =
        content
          .flatMap((c) => c.parts || [])
          .map((p) => p.text || "")
          .join("\n")
          .trim() || ""
    } else if (content && Array.isArray(content.parts)) {
      rawText = content.parts.map((p) => p.text || "").join("\n").trim()
    }

    if (!rawText) {
      console.error("Empty text returned from Gemini. Candidate:", JSON.stringify(candidate, null, 2))
      const reason = (candidate as any)?.finishReason || "UNKNOWN";
      return res.status(502).json({ message: `AI returned empty text. Finish Reason: ${reason}` })
    }

    const questions = rawText
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^\d+[\).\s-]*/, ""))

    if (!questions.length) {
      console.error("Parsed no questions from text:", rawText)
      return res.status(502).json({ message: "Failed to parse questions from AI response." })
    }

    return res.status(200).json({ questions })
  } catch (err) {
    console.error("AI generation error", err)
    return res.status(500).json({ message: "Failed to generate AI questions" })
  }
}