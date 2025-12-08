import { Request, Response } from "express"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string

const FALLBACK_QUESTIONS: string[] = [
  "Tell me about yourself.",
  "Why are you interested in this role?",
  "Describe a challenging project you worked on.",
  "How do you stay up to date with industry trends?",
  "Tell me about a time you worked in a team.",
  "Describe a situation where you solved a difficult problem.",
  "What are your strengths and weaknesses?",
  "Tell me about a time you made a mistake and how you handled it.",
  "Where do you see yourself in five years?",
  "Why should we hire you for this position?"
]

const respondWithFallback = (res: Response) => res.status(200).json({ questions: FALLBACK_QUESTIONS })

let geminiRetryUntil = 0

const shouldSkipGeminiCall = () => Date.now() < geminiRetryUntil

const setGeminiCooldown = (retrySeconds?: number) => {
  const fallbackSeconds = retrySeconds && retrySeconds > 0 ? retrySeconds : 60
  geminiRetryUntil = Date.now() + fallbackSeconds * 1000
}

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

    if (shouldSkipGeminiCall()) {
      console.warn("Skipping Gemini call due to active cooldown; serving fallback questions")
      return respondWithFallback(res)
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
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 512
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          timeout: 30000
        }
      )
    } catch (apiErr: any) {
      console.error("Gemini API error, serving fallback questions:", {
        message: apiErr.message,
        status: apiErr.response?.status,
        data: apiErr.response?.data
      })
      const retryAfterHeader = Number(apiErr.response?.headers?.["retry-after"])
      if (apiErr.response?.status === 429 || apiErr.response?.data?.error?.status === "RESOURCE_EXHAUSTED") {
        let retrySeconds = !Number.isNaN(retryAfterHeader) ? retryAfterHeader : undefined
        if (!retrySeconds) {
          const retryMatch = apiErr.response?.data?.error?.message?.match(/retry in (\d+(?:\.\d+)?)s/i)
          retrySeconds = retryMatch ? Number(retryMatch[1]) : undefined
        }
        setGeminiCooldown(retrySeconds)
      }
      return respondWithFallback(res)
    }

    const candidate = aiResponse.data?.candidates?.[0]
    if (!candidate) {
      console.error("No candidates returned from Gemini, serving fallback:", aiResponse.data)
      return respondWithFallback(res)
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
      console.error("Empty text returned from Gemini, serving fallback:", candidate)
      return respondWithFallback(res)
    }

    const questions = rawText
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^\d+[\).\s-]*/, ""))

    if (!questions.length) {
      console.error("Parsed no questions from text, serving fallback:", rawText)
      return respondWithFallback(res)
    }

    return res.status(200).json({ questions })
  } catch (err) {
    console.error("AI generation error", err)
    return res.status(500).json({ message: "Failed to generate AI questions" })
  }
}