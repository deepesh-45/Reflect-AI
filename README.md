# 🌿 ReflectAI — Student Emotional Reflection Companion

ReflectAI is a secure, AI-powered emotional wellness and journaling platform tailored for students. It combines smart journaling, mood analytics, context-aware conversational AI support, positive community sharing, poetry generation, and future-self letter vaults.

## 🚀 Key Features

* **📝 Smart Journal**: Rich journaling with automated sentiment & emotion analysis (Happy, Sad, Stressed, Angry, Excited, Lonely, Neutral) and key memory extraction.
* **📊 Reflection Dashboard**: Visualizes emotional trends, mood distribution, streak tracking, and personalized weekly AI insights.
* **💬 AI Companion Chat**: An empathetic conversational companion powered by Llama-3.1 via Kiwi, leveraging long-term memories and journal contexts.
* **🎭 Poetry & Writing Corner**: Formulates expressive poems from journal drafts and adjusts text expression (grammar, vocabulary, emotional depth).
* **💌 Future-Self Letter Vault**: Seal letters to be unlocked at a later date, secured in transit.
* **🤝 Peer Community**: A positive, supportive community feed with reactions (Relate, Support, Inspire) and zero comments or downvotes.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Recharts, Vite
* **Backend**: Node.js, Express.js, Firebase Admin SDK
* **Database & Auth**: Firebase Auth, Cloud Firestore
* **AI Engine**: Google Gemini API & Llama-3.1 via Kiwi

---

## 📂 Project Architecture

```text
4th_june_hackathon/
├── docs/                 # GitHub Pages deployment build directory
├── frontend/             # React/Vite web application
│   ├── src/              # React components, pages, and context
│   └── vite.config.js    # Vite compilation & sub-path settings
├── src/                  # Express API backend server
│   ├── config/           # Database connections & mock DB fallbacks
│   ├── middleware/       # Token validation middleware
│   ├── routes/           # REST endpoints
│   └── services/         # Gemini and Kiwi LLM connectors
└── firestore.rules       # Security rules for document isolation
```

---

## 💻 Local Setup Guide

### 1. Prerequisites
* Node.js >= 18.0.0
* Firebase Account

### 2. Dependency Installation
Install dependencies for both folders:
```bash
# Root (Backend)
npm install

# Frontend
cd frontend
npm install
```

### 3. Configuration Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in the parameters (Firebase Project ID, private keys, Gemini API key, and Kiwi credentials).

> 💡 **Developer Mode Fallback**: If you do not provide Firebase keys, the backend automatically boots in **Mock Developer Mode** using an in-memory database and local model mock fallbacks.

### 4. Running the Application
Run both applications locally in separate terminals:

* **Backend Server** (runs on http://localhost:3001):
  ```bash
  npm run dev
  ```
* **Frontend Server** (runs on http://localhost:5173/Reflect-AI/):
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🌐 Production Deployment

### Frontend (GitHub Pages)
The production bundle is built into the `/docs` directory. To deploy on GitHub Pages:
1. Push the `/docs` folder to the `main` branch.
2. Go to your repository **Settings** → **Pages**.
3. Under **Branch**, select `main` and change the folder from `/ (root)` to `/docs`.
4. Save, and your site will be live at `https://<username>.github.io/Reflect-AI/`.
