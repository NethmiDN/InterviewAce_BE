import { Router, Request, Response } from "express"

const router = Router()

router.get("/", (_req, res) => {
  res.json({ message: "AI placeholder" })
})

type GenerateBody = {
  role?: string
  experience?: string
  education?: string
  type?: "technical" | "behavioral" | "mixed"
}

function makeQuestionTemplates() {
  return {
    technical: [
      (role: string) => `Explain a core project or system you built related to ${role}. What architecture did you choose and why?`,
      (role: string) => `Describe a challenging bug you fixed in a ${role} context and how you diagnosed it.`,
      (role: string) => `How do you ensure code quality and testing for ${role} deliverables?`,
      (_: string) => `Explain a time you optimized performance: what metrics did you measure and how did you improve them?`,
      (_: string) => `Walk me through how you'd design a scalable system for an application that must handle high concurrency.`,
      (_: string) => `How do you approach system design trade-offs between consistency, availability and partition tolerance?`,
      (_: string) => `Describe how you would design an authentication and authorization system for a web app.`,
      (_: string) => `What data structures and algorithms would you choose for fast lookup and why?`,
      (_: string) => `How do you approach debugging production incidents and post-mortems?`,
      (_: string) => `Explain CI/CD: what steps are important and how do you keep deployments safe?`,
    ],
    behavioral: [
      (_: string) => `Tell me about a time you had a conflict with a teammate. How did you resolve it?`,
      (_: string) => `Describe a project where you had to learn something new quickly. How did you approach it?`,
      (_: string) => `Give an example of a time you received critical feedback. How did you respond?`,
      (_: string) => `Tell me about a time you took ownership of a difficult task and the outcome.`,
      (_: string) => `Describe how you prioritize tasks when working under tight deadlines.`,
      (_: string) => `How do you handle ambiguity in requirements or goals?`,
      (_: string) => `Describe a time you mentored or helped another engineer grow.`,
      (_: string) => `Tell me about a successful cross-functional collaboration you were part of.`,
      (_: string) => `Give an example of when you had to make a trade-off between speed and quality.`,
      (_: string) => `How do you measure success for your work? Provide a real example.`,
    ],
  }
}

function generateQuestions(body: GenerateBody): string[] {
  const templates = makeQuestionTemplates()
  const pool: Array<(role: string) => string> = []

  const type = body.type || "mixed"
  if (type === "technical") pool.push(...templates.technical)
  else if (type === "behavioral") pool.push(...templates.behavioral)
  else pool.push(...templates.technical, ...templates.behavioral)

  const role = body.role || "the role"
  const questions: string[] = []

  // Simple deterministic selection and variation to produce 20 questions
  let i = 0
  while (questions.length < 20) {
    const tmpl = pool[i % pool.length]
    let q = tmpl(role)
    // add small variation based on experience/education
    if (body.experience) q += ` (Experience: ${body.experience})`
    if (body.education) q += ` (Education: ${body.education})`
    questions.push(q)
    i++
  }

  return questions
}

router.post("/generate", (req: Request, res: Response) => {
  const body = req.body as GenerateBody
  try {
    const questions = generateQuestions(body)
    res.json({ questions })
  } catch (err) {
    res.status(500).json({ error: "Failed to generate questions" })
  }
})

export default router
