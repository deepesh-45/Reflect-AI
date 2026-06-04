# ReflectAI — Student Emotional Reflection Companion

ReflectAI is a production-grade, AI-powered emotional reflection companion designed for students. The application combines smart journaling, emotional analytics, context-aware AI conversations, anonymous community support, writing enhancement, poetry generation, and future-self letters.

The project uses a decoupled, production-secure architecture:
1. **Frontend UI**: Built with a clean, wellness-themed design system (lexend fonts, soft grids, calm tone indicators) managed via Google Stitch.
2. **Backend API**: Engineered with a Node.js/Express framework secured by Firebase Authentication and isolating user context.
3. **Hybrid AI Engine**: Google Gemini handles structured cognitive tasks (emotion parsing, memory extraction, poetry, text improvement, summaries) while Kiwi LLM acts as the supportive chat reflection companion.

---

## Folder Structure

```
4th_june_hackathon/
├── .env                  # Local environment configuration variables
├── .env.example          # Template environment variable placeholders
├── .gitignore            # Git safety configuration
├── firestore.rules       # Firestore Security Rules for data isolation
├── package.json          # Node dependencies and execution scripts
├── FRONTEND_MAP.md       # Stitch frontend route & state specifications
├── README.md             # Documentation (this file)
└── src/
    ├── server.js         # Express app entry point
    ├── config/
    │   └── firebase.js   # Firebase Admin SDK & local mock database config
    ├── middleware/
    │   └── auth.js       # Firebase ID token validation middleware
    ├── routes/
    │   ├── assistant.js  # Poetry & Writing helper endpoints
    │   ├── chat.js       # Contextual AI companion chat endpoints
    │   ├── community.js  # Anonymous posts & positive reactions
    │   ├── dashboard.js  # Weekly mood analytics compiling routes
    │   ├── journal.js    # Journal entries CRUD router
    │   └── letters.js    # Vaulted future-self letters router
    └── services/
        ├── geminiService.js  # Google Gemini API structured client
        └── kiwiService.js    # Kiwi LLM conversation prompt compiler
```

---

## Setup & Local Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Firebase Account (for production deployment)

### 1. Installation
Clone or navigate to the workspace directory and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your API credentials:
```bash
cp .env.example .env
```

If you do not configure Firebase Admin SDK credentials or AI keys, the server will automatically default to **Mock Developer Mode** allowing you to test endpoints locally using local in-memory stores and mock AI responders!

To authorize client requests in **Mock Developer Mode**, pass the header:
`Authorization: Bearer mock-token-<username>` (e.g., `Bearer mock-token-student123`).

### 3. Run the Server
Start the Express server in development hot-reload mode:
```bash
npm run dev
```
For production:
```bash
npm start
```
The server launches at `http://localhost:5000`. You can query the health endpoint: `GET http://localhost:5000/health`.

---

## API Architecture

All endpoints (except `/health`) require user authentication passed securely in headers:
`Authorization: Bearer <firebase_id_token>`

### 1. Smart Journal (`/api/journal`)
- `POST /`: Write new entry. Triggers Gemini emotion analysis + memory extraction. Stored in Firestore database.
- `GET /`: Search and fetch journal entry history.
- `GET /:id`: Fetch detail for a specific entry.
- `PUT /:id`: Update entry. Triggers emotion + memory re-extraction.
- `DELETE /:id`: Delete entry and remove associated memories.

### 2. AI Companion Conversation (`/api/chat`)
- `POST /`: Send message. Dynamically compiles chat logs, recent journals, and long-term user memories. Sends the contextual prompt to Kiwi LLM.
- `GET /history`: Fetch active conversation timeline.
- `DELETE /history`: Reset chat history.

### 3. Weekly Reflection Dashboard (`/api/dashboard`)
- `GET /`: Returns data payload containing:
  - Weekly reflection card summary text (generated via Gemini).
  - Mood timeline data arrays (for line charts).
  - Emotion distribution percentage lists (for pie charts).
  - Current reflection streak counter (days in a row).

### 4. Anonymous Community Feed (`/api/community`)
- `POST /`: Publish reflection post. Toggleable `anonymous` parameter.
- `GET /`: Fetch public feed. If a post is anonymous, the author's uid and name are securely masked on the server.
- `POST /:id/react`: Increment a positive reaction (`relate` ❤️, `support` 🤝, or `inspire` 🌟). Dislikes are not supported.

### 5. Future Self letters (`/api/letters`)
- `POST /`: Seal a letter. Select lock durations: `1M` (1 month), `3M`, `6M`, `1Y`.
- `GET /`: List letters. Returns title and unlock countdown. The `content` is securely replaced with a locked placeholder if `now < unlockDate`.
- `GET /:id`: Retrieve letter. Returns 403 Forbidden if the user attempts to view details before the lock expires.

### 6. Assistant Tools (`/api/assistant`)
- `POST /write-assist`: Rewrites input thoughts using Gemini. Actions: `Improve Expression`, `Improve Vocabulary`, `Correct Grammar`, `Enhance Emotional Depth`, `Rewrite Thoughtfully`.
- `POST /poetry`: Converts text/journals into a poem. Styles: `Free Verse`, `Reflective`, `Motivational`, `Emotional`. Saves poem to library.
- `GET /poetry`: Fetch saved poetry collection.

---

## Database Schemas (Firestore)

### `users`
- `uid` (string, primary)
- `name` (string)
- `email` (string)
- `createdAt` (timestamp)

### `journal_entries`
- `id` (string, primary)
- `uid` (string, index)
- `title` (string)
- `content` (string)
- `emotion` (string: Happy, Sad, Stressed, Angry, Excited, Lonely, Neutral)
- `confidence` (number)
- `summary` (string)
- `createdAt` (timestamp)

### `memories`
- `id` (string, primary)
- `uid` (string, index)
- `content` (string)
- `category` (string: Interests, Goals, Concerns, Positive Experiences, Recurring Events)
- `originalJournalId` (string)
- `createdAt` (timestamp)

### `chat_history`
- `id` (string, primary)
- `uid` (string, index)
- `role` (string: user / model)
- `message` (string)
- `timestamp` (timestamp)

### `community_posts`
- `id` (string, primary)
- `uid` (string)
- `content` (string)
- `anonymous` (boolean)
- `relateCount` (number)
- `supportCount` (number)
- `inspireCount` (number)
- `createdAt` (timestamp)

### `future_letters`
- `id` (string, primary)
- `uid` (string, index)
- `title` (string)
- `content` (string)
- `unlockDate` (timestamp)
- `createdAt` (timestamp)

### `poems`
- `id` (string, primary)
- `uid` (string, index)
- `originalJournalId` (string)
- `generatedPoem` (string)
- `style` (string)
- `createdAt` (timestamp)

---

## AI Prompt Templates

### Google Gemini

#### 1. Emotion Detection
```
You are an emotional intelligence agent. Analyze the following student journal entry:
"${text}"

Determine:
1. The dominant emotion (Must be exactly one of: Happy, Sad, Stressed, Angry, Excited, Lonely, Neutral).
2. The confidence score (integer percentage between 0 and 100).
3. A brief, supportive, one-sentence summary of why they feel this way.

Format your response as a strict JSON object with fields: "emotion", "confidence", and "summary". Do not return markdown block quotes.
```

#### 2. Memory Extraction
```
You are a context extraction assistant. Analyze this student journal entry:
"${text}"

Extract important personal facts, preferences, goals, concerns, or recurring events.
Categorize each extracted memory into one of these: "Interests", "Goals", "Concerns", "Positive Experiences", "Recurring Events".

Format the response as a strict JSON array of objects, where each object has fields "content" (string, max 10 words) and "category" (string). Return an empty array if nothing fits.
Do not return markdown block quotes.
```

#### 3. Weekly Reflection Summary
```
You are a reflection mentor. Here are a student's journal entries from the past week:
${combinedText}

Synthesize these entries into a warm, empathetic, and encouraging weekly reflection summary (max 3 sentences). Identify patterns or progress and suggest a gentle area of focus for the upcoming week.
```

---

### Kiwi LLM

#### Conversational Companion
```
You are ReflectAI, an empathetic and thoughtful AI reflection companion designed for students.
Your goal is to help users understand their emotions, encourage self-reflection, and check in on their concerns and interests.

CRITICAL SAFETY RULES:
1. NEVER claim to be a therapist.
2. NEVER diagnose any psychological conditions.
3. NEVER provide medical or clinical advice.
4. Speak in a warm, friendly, supportive, and non-judgmental student-reflection tone.

Here is the student's background context (Long-term memories, recent journal reflections, and recent chats):

1. LONG-TERM MEMORIES:
${memories}

2. RECENT JOURNAL REFLECTIONS:
${recentJournals}

3. RECENT CONVERSATIONS:
${chatHistory}

Please respond to the user's latest statement: "${userMessage}"

Acknowledge their thoughts, refer naturally to their stored memories or journals if relevant, and ask exactly one thoughtful follow-up question to encourage deeper reflection. Keep responses concise (3-4 sentences maximum).
```

---

## Security Policies & Rules

1. **API Credentials Protection**: Real keys are loaded strictly from the environment context `.env` which is ignored in Git.
2. **User Data Isolation**: Firestore database rules enforce that a student user can read or modify *only* their owned items (journals, memories, chat history, and sealed letters).
3. **Countdown Enforcer**: Letters are locked in transit. The server queries and filters entries securely; the text content of a future self letter is never serialized over the wire unless `now >= unlockDate`.
4. **Input Validation**: Endpoint routers check for required inputs and validate request parameters prior to executing AI and database instructions.
5. **Positive-Only Environment**: The community feed blocks downvotes or custom text-based comment threads. Interpersonal feedback is limited to incrementing reaction values (`relateCount`, `supportCount`, `inspireCount`).

---

## Deployment Guide

### Backend Cloud Hosting
1. Setup a Node.js runtime container (such as Google App Engine, Cloud Run, or Render).
2. Configure environment variables in the provider dashboard (matching `.env.example` settings).
3. Connect the repository, build using `npm run start`, and test routing connections.

### Firestore Rules Deploy
Deploy firestore configuration from local cli:
```bash
firebase deploy --only firestore:rules
```
