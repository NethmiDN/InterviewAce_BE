import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  registerAdmin,
  registerUser,
  updateMyProfile
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { Role } from "../models/user.model"

const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

// login - public
router.post("/login", login)

router.post("/refresh", refreshToken)

// register (ADMIN) - Admin only
router.post(
  "/admin/register",
  authenticate,
  requireRole([Role.ADMIN]),
  registerAdmin
)

// me - Admin or User both
router.get("/me", authenticate, getMyProfile)

// update profile - authenticated user
router.put("/me", authenticate, updateMyProfile)

// router.get("/test", authenticate, () => {})

export default router
