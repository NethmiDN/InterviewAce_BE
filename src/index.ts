import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRouter from "./routes/auth"
import postRouter from "./routes/post"
import aiRouter from "./routes/ai"
dotenv.config()

const BASE_PORT = Number(process.env.PORT) || 5000
const MAX_PORT_SHIFT = 10
const MONGO_URI = process.env.MONGO_URI as string

const app = express()

app.use(express.json())
app.use(
  cors({
    // origin: ["http://localhost:5173", "https://blog-post-fe-8wgl.vercel.app"],
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"] // optional
  })
)

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/post", postRouter)
app.use("/api/v1/ai", aiRouter)

// welcome route
app.get("/", (_req, res) => {
  res.send("Welcome to InterviewAce API")
})

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("DB connected")
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

const startServer = (port: number, attemptsLeft: number) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1
      console.warn(`Port ${port} is busy; retrying on ${nextPort}`)
      server.close(() => startServer(nextPort, attemptsLeft - 1))
      return
    }

    console.error(`Failed to bind port ${port}`, err)
    process.exit(1)
  })
}

startServer(BASE_PORT, MAX_PORT_SHIFT)

// --------------------------------------
// // Built in middlewares (Global)
// app.use(express.json())

// // Thrid party middlewares (Global)
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "DELETE"] // optional
//   })
// )

// // Global middleware
// app.use((req, res, next) => {
//   console.log("Hello")
//   if (true) {
//     next() // go forword
//   } else {
//     res.sendStatus(400) // stop
//   }
// })

// app.get("/hello", testMiddleware, (req, res) => {
//   //
//   res.send("")
// })

// app.get("/", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })

// app.get("/private", testMiddleware, (req, res) => {
//   console.log("I'm router")
//   res.status(200).send("Ok")
// })

// app.get("/test", (req, res) => {
//   res.status(200).send("Test Ok")
// })

// app.listen(5000, () => {
//   console.log("Server is running")
// })

// path params
// http://localhost:5000/1234
// http://localhost:5000/4321
// http://localhost:5000/hello
// app.get("/:id", (req, res) => {
//   const params = req.params
//   console.log(params)
//   console.log(params?.id)

//   res.status(200).send("Ok")
// })

// query params ?id=1234
// http://localhost:5000/?id=1234
// http://localhost:5000/?id=4321
// app.get("/", (req, res) => {
//   const params = req.query
//   console.log(params)
//   console.log(params?.id)

//   res.status(200).send("Ok")
// })


