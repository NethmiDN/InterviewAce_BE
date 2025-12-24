import { Router } from "express"
import {
  getMyProfile,
  login,
  refreshToken,
  registerUser,
  updateMyProfile,
  uploadProfilePicture,
  changeMyPassword,
  requestPasswordReset,
  resetPasswordWithOtp
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth"
import multer from "multer"

const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

// login - public
router.post("/login", login)

// forgot password - public
router.post("/forgot-password", requestPasswordReset)

// reset password with OTP - public
router.post("/reset-password", resetPasswordWithOtp)

router.post("/refresh", refreshToken)

// me - authenticated user
router.get("/profile", authenticate, getMyProfile)

// update profile - authenticated user
router.put("/me", authenticate, updateMyProfile)

// change password - authenticated user
router.put("/me/password", authenticate, changeMyPassword)

const upload = multer({ storage: multer.memoryStorage() })

// upload or change profile picture
router.post("/me/avatar", authenticate, upload.single("avatar"), uploadProfilePicture)

// router.get("/test", authenticate, () => {})

export default router
