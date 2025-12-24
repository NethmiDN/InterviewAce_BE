import { Router } from "express"
import { generateAiQuestions } from "../controllers/ai.controller"

const router = Router()

router.get("/", (_req, res) => {
  res.json({ message: "AI endpoint" })
})

router.post("/create", generateAiQuestions)

export default router
