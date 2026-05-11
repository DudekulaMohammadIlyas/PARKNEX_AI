# ParkNex-AI

ParkNex-AI is a smart parking management platform designed for university campuses. It combines a mobile app, admin web portal, backend API, and AI vision service to automate vehicle entry/exit, parking occupancy tracking, and digital passes.

## 🚀 Project Overview

- **Mobile App:** Expo-based React Native application for students, security, and campus staff.
- **Web Portal:** React + Vite admin dashboard for managing zones, events, and occupancy.
- **Backend:** Node.js + Express API using Prisma with Supabase/PostgreSQL.
- **AI Service:** Python service using YOLOv8 + EasyOCR for vehicle detection and license plate recognition.
- **Realtime Data:** Supabase provides database hosting and optional realtime updates.

## 📁 Repository Structure

- `backend/` — Express API, Prisma ORM, database seed script.
- `web-app/` — Web admin dashboard and student-facing portal.
- `mobile-app/` — Expo React Native mobile application.
- `ai-service/` — Python AI vision service and model integration.
- `.gitignore` — ignore rules for generated files and secrets.
- `.gitattributes` — line endings normalization.
- `.env.example` — root reference file for environment configuration.

## ✨ Features

- Parking zone management
- Occupancy monitoring and event logs
- Admin and student dashboards
- AI-triggered vehicle detection
- License plate OCR support
- Backend API for event simulation
- Expo mobile client for live campus access

## 🛠 Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/DudekulaMohammadIlyas/PARKNEX_AI.git
cd PARKNEX_AI
```

### 2. Prepare environment files

Copy the example env files into each subproject and update values:

```bash
copy .env.example backend\.env
copy .env.example ai-service\.env
copy web-app\.env.example web-app\.env
copy mobile-app\.env.example mobile-app\.env
```

Then update the values for your local environment.

> Note: `backend/.env`, `ai-service/.env`, `web-app/.env`, and `mobile-app/.env` are ignored and should not be committed.

## 🚧 Backend Setup

```bash
cd backend
npm install
npm install prisma --save-dev
npx prisma generate
npx prisma db push
npm run dev
```

Backend starts on `http://localhost:5000` by default.

## 🤖 AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

The AI service uses `yolov8n.pt` and requires valid Supabase credentials in `ai-service/.env`.

## 🌐 Web App Setup

```bash
cd web-app
npm install
npm run dev
```

Web admin dashboard runs on Vite and should load at `http://localhost:5173` by default.

## 📱 Mobile App Setup

```bash
cd mobile-app
npm install
npx expo start
```

Update `mobile-app/config.js` or `mobile-app/.env` before starting to point to your backend API.

## 🔐 Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL`
- `DIRECT_URL`
- `PORT`

### AI Service (`ai-service/.env`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `BACKEND_URL`
- `ZONE_ID`
- `FORCE_MOCK`

### Web App (`web-app/.env`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Mobile App (`mobile-app/.env`)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_BACKEND_URL`

## 📸 Screenshots

_Add screenshots here when available._

## 🚀 Future Enhancements

- Add user authentication and role-based access
- Add live realtime notifications on mobile and web
- Add license plate history and analytics
- Add camera-based entry validation
- Add payment gateway integration

## 🤝 Contribution

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Make your changes and test locally.
4. Commit with clear messages.
5. Push to your fork and open a pull request.

## 📌 Recommended Git Commands

```bash
git init
git checkout -b main
git add .
git commit -m "chore: initialize ParkNex-AI repository and add clean project structure"
git remote add origin https://github.com/DudekulaMohammadIlyas/PARKNEX_AI.git
git push -u origin main
```
