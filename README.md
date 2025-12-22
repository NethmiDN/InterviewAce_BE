# InterviewAce - Backend

**Deployed URL:** [https://interview-ace-be.vercel.app](https://interview-ace-be.vercel.app/)

## Project Description
This is the **RESTful API** backend for InterviewAce, a Full Stack Web Application built with the **MERN stack** and **TypeScript**. It provides secure authentication, profile management, and AI-powered interview question generation.

The backend is designed to be scalable and secure, following best practices such as JWT authentication, password hashing, and role-based access control (RBAC).

## Technologies and Tools Used
-   **Runtime:** Node.js, Express.js
-   **Language:** TypeScript
-   **Database:** MongoDB Atlas (Mongoose ODM)
-   **Authentication:** JSON Web Tokens (JWT), bcryptjs
-   **AI Integration:** Google Gemini API (Content Generation)
-   **Storage:** Cloudinary (Avatar Uploads)
-   **Deployment:** Vercel

## Main Features
1.  **Secure Authentication**:
    -   User registration and login.
    -   JWT-based access and refresh token rotation.
    -   Password encryption using `bcryptjs`.
2.  **Advanced Feature: AI API Integration**:
    -   Integration with **Google Gemini** to generate context-aware interview questions based on user roles (e.g., "Senior React Developer").
    -   Graceful fallback mechanism if the AI service is unavailable.
3.  **Profile Management**:
    -   Endpoints for viewing and updating user profiles.
    -   Avatar image upload support via Cloudinary and Multer.
4.  **Security**:
    -   Protected routes using middleware (`authenticate`, `requireRole`).
    -   Secure environment variable management.

## Setup and Run Instructions

### 1. Prerequisites
-   Node.js (v18+)
-   MongoDB Atlas Account
-   Google Gemini API Key
-   Cloudinary Account

### 2. Installation
```powershell
# Clone the repository
git clone <repository_url>

# Navigate to the backend directory
cd interviewace_be

# Install dependencies
npm install
```

### 3. Environment Headers
Create a `.env` file in the root directory and populate it with the following secrets:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/interviewace
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_super_refresh_secret
GEMINI_API_KEY=your_google_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 4. Run Locally
```powershell
# Run in development mode (with ts-node)
npm run dev

# OR build and start
npm run build
npm start
```
The server will start on `http://localhost:5000` (or your specfied PORT).

### 5. API Documentation
Key endpoints include:
-   `POST /api/v1/auth/register` - Create account
-   `POST /api/v1/auth/login` - Login
-   `POST /api/v1/ai/generate` - Generate AI questions (Advanced Feature)
-   `GET /api/v1/auth/me` - Get current user profile

---
*Submitted as part of the Full Stack Web Application Development Coursework.*
