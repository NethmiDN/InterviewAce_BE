import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { Role } from "../models/user.model"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthPayload {
  sub: string
  roles?: Role[]
  iat?: number
  exp?: number
}

export interface AUthRequest extends Request {
  user?: AuthPayload
}

export const authenticate = (
  req: AUthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" })
  }
  // Bearer dgcfhvgjygukhiluytkuy
  const token = authHeader.split(" ")[1] // ["Bearer", "dgcfhvgjygukhiluytkuy"]

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    //  {
    //   sub: user._id.toString(),
    //   roles: user.roles
    // }
    req.user = payload
    next()
  } catch (err) {
    console.error(err)
    res.status(401).json({
      message: "Invalid or expire token"
    })
  }
}
// res, next - return
