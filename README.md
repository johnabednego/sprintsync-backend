# SprintSync Backend

## Server URL
```bash
https://sprintsync-backend.vercel.app
```

A lean, cloud‑ready Express.js backend for SprintSync—an internal tool that lets engineers log work, track time, and lean on AI for quick planning help. This repo serves as a reference for clear architecture, tight DevOps, and thoughtful API design.


## 📦 Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js  
- **Database**: MongoDB (via Mongoose)  
- **Auth**: JWT (Bearer tokens)  
- **Docs**: Swagger UI (OpenAPI 3.0)  
- **Email**: Nodemailer (Gmail SMTP)  
- **Logging**: console (structured JSON)  
- **Containerization**: Docker & docker‑compose  

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/johnabednego/sprintsync-backend.git
cd sprintsync-backend
npm install
````

### 2. Environment Variables

Create a `.env` file in project root:

```ini
# .env file
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.yn9ml.mongodb.net/<database-name>?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=your-jwt_secret_key
PORT=5000

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000,https://your-frontend.com


# ========================
# Server & Environment
# ========================
NODE_ENV=development             # 'development' or 'production' 
JWT_EXPIRES_IN=1h                # Token expiry (1h, 24h, etc.)

# ========================
# Email (SMTP)
# ========================
SMTP_HOST= (e.g. smtp.gmail.com)
SMTP_PORT= (eg. 587)
SMTP_USER=(eg. john@example.com)
SMTP_PASS=your_password
SMTP_FROM=your_from_email
```

### 3. Run Locally

```bash
npm run dev
```

Your API will be available at `http://localhost:5000`.

## 📄 API Documentation

Once your server is running, browse interactive docs at:

```bash
http://localhost:5000/api-docs
```

All endpoints—including **Auth**, **Users**, **Tasks**, **Projects**, **TimeEntries**, **Tags**, **Comments**, **AuditLogs**, **Notifications**, and **AI Assist** are documented there.


## 🔑 Authentication

* **Signup**: `POST /auth/signup`
* **Login**:  `POST /auth/login`
* **Protected** routes require:

  Authorization: Bearer <token>
  

## ⚙️ Core Endpoints

| Resource          | Routes                                      | Notes                                        |
| ----------------- | ------------------------------------------- | -------------------------------------------- |
| **Users**         | CRUD under `/users`                         | Admin‑only for list/delete                   |
| **Tasks**         | CRUD under `/tasks` + status transitions    | Inline To Do → In Progress → Done            |
| **Projects**      | CRUD under `/projects`                      |                                              |
| **TimeEntries**   | CRUD under `/time-entries`                  | Tracks minutes per task                      |
| **Tags**          | CRUD under `/tags`                          | Associate with tasks                         |
| **Comments**      | CRUD under `/comments`                      | Leave comments on tasks                      |
| **AuditLogs**     | List & get under `/audit-logs` (admin only) | Records every create/update/delete etc.      |
| **Notifications** | List & mark‑read under `/notifications`     | In‑app + optional email pushes               |
| **AI Assist**     | `POST /ai/suggest`                          | Stubbed LLM for draftDescription & dailyPlan |


## 🤖 AI Assist (Stub)

* **Mode**: `draftDescription` or `dailyPlan`
* **Request**:

  ```jsonc
  {
    "mode": "draftDescription",
    "payload": { "title": "Write tests for Task API" }
  }
  ```
* **Response**:

  ```json
  { 
    "ok": true,
    "data": {
      "title": "Write tests for Task API",
      "description": "“Write tests for Task API” is a key sprint task. Steps: …"
    }
  }
  ```
* **Future**: swap stub in `services/aiService.js` for a real LLM call when API keys arrive.


## 📧 Email & Notifications

* **OTP emails** for signup/reset (`sendOTP`)
* **AuditLog emails** (`sendAuditNotification`) show “before/after” diffs
* **Notification emails** (`sendNotificationEmail`) for key events (e.g. task assignment)
* In‑app notifications stored in MongoDB and fetched via `/notifications`


## 🗒️ Estimates & Time Logging

See [estimates.csv](./estimates.csv) for initial vs. actual hours:

| Task                           | Estimated (h) | Actual (h) |
| ------------------------------ | ------------- | ---------- |
| Initialize database connection | 0.5           | 0.1        |
| Set up Swagger UI              | 0.5           | 0.2        |
| …                              | …             | …          |
| **AI Assist Stub**             | 1.0           | 0.4        |

This CSV is updated as work progresses—demonstrating realistic estimation and reflection.


## 🐳 Docker & Deployment

1. **Build & Run** locally with Docker Compose:
   **I didn't use docker though**
   ```bash
   docker-compose up --build
   ```
2. **Deploy** on Render / Railway / Fly / AWS / Vercel
   *I deployed on Vercel* 
   * Ensure your `.env` vars are set in the cloud provider.


## 📺 Demo & Video

End‑user demo of the frontend application ( 5 mins)

Video Link
```bash
https://drive.google.com/file/d/1sQnnH-9gm6TpsE55hnysSG1XHbyWWS0H/view?usp=sharing
```

## 📞 Questions & Notes

Feel free to raise any questions or suggestions. Enjoy exploring and extending SprintSync!


**SprintSync** · Built with ❤️ for GenAI.Labs Challenge
