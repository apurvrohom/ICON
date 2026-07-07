# ICON - Enterprise Idea-CONnect Collaboration Platform

ICON is a production-grade, highly scalable team collaboration platform (akin to a hybrid of LinkedIn and GitHub) designed for modern engineering teams. It allows users to register profiles, discover public workspaces, collaborate via shared notes, upload resources, manage tasks on a real-time Kanban board, and chat inside instant message channels.

This codebase has been upgraded from a student-level MVP to an **enterprise-ready, production-grade architecture** featuring robust security hardening, full TypeScript type-safety, global state management, instant real-time synchronization, and containerized deployment.

---

## 🚀 Key Upgraded Features

### 1. Robust Security & Hardened Auth
- **HttpOnly JWT Session Rotation:** Access tokens are short-lived, while refresh tokens are rotated via secure, client-inaccessible `HttpOnly` cookies to protect against XSS and token-hijacking.
- **Payload Schema Validation:** Strict runtime validation of all request inputs using **Zod** schema guards, returning descriptive client-friendly field errors.
- **Express Security Middleware:** Integrated **Helmet** header configurations, CORS whitelist configurations, and Express Rate Limiting to mitigate brute force attempts.

### 2. Global State & API Centralization
- **Zustand State Engine:** Refactored state management to lightweight, high-performance Zustand stores (`useAuthStore`, `useNotificationStore`, and `useSocketStore`) to eliminate prop-drilling.
- **Centralized API Interceptors:** Preconfigured Axios client handling authorization token injection and automatic token refresh workflows.

### 3. Real-Time Collaboration Core
- **Collaborative Kanban Board:** Drag-and-drop task workflow implemented with `@dnd-kit/core` and `@dnd-kit/sortable`, featuring inline task creation, checklist managers, comment sections, and detailed change logs.
- **Project-Level Room Syncing:** Moving or editing cards instantly reflects on all online board members' screens in real-time.
- **Typing Indicators & Presence:** Active typing notifications and user online status indicators synchronize over global sockets.
- **Socket-Driven Live Notifications:** Global push notification system updating the Navbar unread badge in real-time, accompanied by a premium notification chime.

### 4. Resilient Cloud Storage (Cloudinary + Local Fallback)
- **Multer Memory Buffer Streaming:** Uploads are streamed directly into Cloudinary.
- **Automatic Fallback:** If Cloudinary credentials are not configured in `.env`, the system gracefully degrades to local disk writes on the server without breaking the application, raising a console warning.

### 5. Advanced Backend Architecture
- **Global Error Boundary:** Unified centralized error middleware mapping standard exception formats and logging detailed runtime stacks.
- **Winston Log Rotation:** Multi-transport logging printing colored logs to standard output in development and saving structured JSON logs to `logs/error.log` and `logs/combined.log` in production.
- **Redis Cache Layer:** Preconfigured Redis client with local cache-map fallback, enabling public listings caching to minimize database hits.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, Zustand, Axios, `@dnd-kit`, Chart.js, React Icons.
- **Backend:** Node.js, Express, TypeScript, Socket.io, Mongoose, Redis client, Winston, Zod.
- **Databases:** MongoDB, Redis.
- **CI/CD & DevOps:** Docker, Docker Compose, GitHub Actions.
- **Testing:** Jest, Vitest.

---

## 📁 Upgraded Project Structure

```text
ICON/
├── backend/
│   ├── config/
│   │   ├── db.ts               # Database Connection
│   │   └── redis.ts            # Redis Cache client with memory fallback
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── requestController.ts
│   │   ├── taskController.ts   # Task Management Controller
│   │   ├── userController.ts
│   │   └── workspaceController.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts  # Global Error Handling
│   │   ├── roleMiddleware.ts   # RBAC Middleware
│   │   └── validationMiddleware.ts
│   ├── models/
│   │   ├── Message.ts
│   │   ├── Notification.ts
│   │   ├── Project.ts
│   │   ├── Request.ts
│   │   ├── Task.ts             # Collaborative Task Schema
│   │   ├── User.ts
│   │   └── Workspace.ts
│   ├── routes/
│   │   └── [routeFiles].ts
│   ├── tests/
│   │   └── validators.test.ts  # Jest Schema unit tests
│   ├── utils/
│   │   ├── logger.ts           # Winston logger configuration
│   │   └── socketNotifier.ts   # Real-time socket emitter helper
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── Kanban.module.css
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetailModal.tsx
│   │   │   └── NotificationsPanel.tsx
│   │   ├── store/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useNotificationStore.ts
│   │   │   └── useSocketStore.ts
│   │   ├── tests/
│   │   │   └── authStore.test.ts  # Vitest Client store tests
│   │   └── [pages/components]
│   ├── Dockerfile
│   ├── nginx.conf
│   └── tsconfig.json
└── docker-compose.yml           # Root multi-container composer orchestrator
```

---

## ⚡ Setup & Run

### A. Run with Docker (Recommended)
Launch the entire system, including MongoDB, Redis, Backend, and Frontend containers with a single command:
```bash
docker-compose up --build
```
The client app is immediately accessible at `http://localhost`.

### B. Run Locally

#### 1. Backend Setup
1. Navigate to directory and install packages:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env`:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/icon
   PORT=5000
   JWT_SECRET=enter_secure_key
   # Cloudinary (Optional, falls back to local storage if omitted)
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```
3. Run compiler checks & start server:
   ```bash
   npm run check
   npm run dev
   ```

#### 2. Frontend Setup
1. Navigate to directory and install packages:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development bundler:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Backend Unit Tests
Execute the Jest validator unit tests:
```bash
cd backend
npm run test
```

### Client Store Tests
Execute Vitest store tests:
```bash
cd frontend
npm run test
```
