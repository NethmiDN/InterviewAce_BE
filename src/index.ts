import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRouter from "./routes/auth";
import postRouter from "./routes/post";
import aiRouter from "./routes/ai";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI as string;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://interviewacefe.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true
  })
);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/ai", aiRouter);

// Welcome route
app.get("/", (_req, res) => {
  res.send("Welcome to InterviewAce API");
});

// Database Connection and Server Startup
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ DB connected successfully");

    // DB සම්බන්ධ වූ පසු පමණක් Server එක listen කිරීම ආරම්භ කරයි
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
    process.exit(1); // Connection එක අසාර්ථක නම් process එක නතර කරයි
  });

// Vercel සඳහා app එක export කිරීම අවශ්‍ය විය හැක
export default app;