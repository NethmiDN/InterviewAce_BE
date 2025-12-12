import { Request, Response } from "express"
import { IUSER, Role, User } from "../models/user.model"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "../utils/tokens"
import { AUthRequest } from "../middleware/auth"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import cloudinary from "../utils/cloudinary"
import crypto from "crypto"
import { sendPasswordResetOtpEmail } from "../utils/mailer"
dotenv.config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstname, lastname } = req.body

    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "email, password, firstname and lastname are required" })
    }

    // left email form model, right side data varible
    //   User.findOne({ email: email })
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    //   new User()
    const user = await User.create({
      email,
      password: hash,
      firstname,
      lastname,
      roles: [Role.USER]
    })

    res.status(201).json({
      message: "User registed",
      data: { email: user.email, roles: user.roles }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal; server error"
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, existingUser.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(existingUser)
    const refreshToken = signRefreshToken(existingUser)

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken,
        refreshToken
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal; server error"
    })
  }
}



export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string }

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const hashedToken = crypto.createHash("sha256").update(otp).digest("hex")

      user.resetPasswordToken = hashedToken
      user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15) // 15 minutes
      await user.save({ validateBeforeSave: false })

      await sendPasswordResetOtpEmail(user.email, otp)
    }

    return res.status(200).json({
      message: "If an account exists for that email, we sent password reset instructions."
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Failed to process password reset request" })
  }
}


export const getMyProfile = async (req: AUthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const user = await User.findById(req.user.sub).select("-password")

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const { email, roles, _id, firstname, lastname, avatarUrl } = user

  res.status(200).json({
    message: "ok",
    data: { id: _id, email, roles, firstname, lastname, avatarUrl }
  })
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: "Token required" })
    }

    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload & {
      sub: string
    }
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" })
    }
    const accessToken = signAccessToken(user)

    res.status(200).json({
      accessToken
    })
  } catch (err) {
    console.error(err)
    res.status(403).json({ message: "Invalid or expire token" })
  }
}

export const updateMyProfile = async (req: AUthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const { firstname, lastname, email } = req.body as {
      firstname?: string
      lastname?: string
      email?: string
    }

    if (!firstname && !lastname && !email) {
      return res.status(400).json({ message: "At least one field (firstname, lastname, email) required" })
    }

    const user = await User.findById(req.user.sub)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email })
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" })
      }
      user.email = email.toLowerCase()
    }
    if (firstname) user.firstname = firstname
    if (lastname) user.lastname = lastname

    await user.save()

    const { _id, roles, avatarUrl } = user
    res.status(200).json({
      message: "updated",
      data: { id: _id, email: user.email, roles, firstname: user.firstname, lastname: user.lastname, avatarUrl }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const changeMyPassword = async (req: AUthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" })
    }

    const user = await User.findById(req.user.sub)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    user.password = hash
    await user.save()

    return res.status(200).json({ message: "Password updated successfully" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const uploadProfilePicture = async (req: AUthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ message: "No file uploaded" })

    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: "User not found" })

    // delete existing image on cloudinary if present
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId)
      } catch (err) {
        console.warn("Failed to delete previous image", err)
      }
    }

    // upload new image from buffer
    const uploadFromBuffer = (buffer: Buffer) =>
      new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_pictures" },
          (
            error: import("cloudinary").UploadApiErrorResponse | undefined,
            result: import("cloudinary").UploadApiResponse | undefined
          ) => {
          if (error) return reject(error)
          if (!result) return reject(new Error("No result from Cloudinary"))
          // @ts-ignore
          resolve({ secure_url: result.secure_url, public_id: result.public_id })
          }
        )
        stream.end(buffer)
      })

    const result = await uploadFromBuffer(file.buffer)

    user.avatarUrl = result.secure_url
    user.avatarPublicId = result.public_id
    await user.save()

    const { _id, email, roles, firstname, lastname, avatarUrl } = user
    return res.status(200).json({ message: "uploaded", data: { id: _id, email, roles, firstname, lastname, avatarUrl } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Failed to upload image" })
  }
}
