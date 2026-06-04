# ReflectAI – Your AI Reflection Companion

Tagline:
Write. Reflect. Remember. Grow.

---

# Project Overview

ReflectAI is an AI-powered emotional reflection and journaling platform designed specifically for students as a web application.

Unlike traditional journaling websites that only store entries, ReflectAI acts as a personalized AI companion that helps users understand their emotions, reflect on experiences, track emotional growth, express themselves creatively, and connect anonymously with a supportive community.

The platform combines journaling, emotional intelligence, long-term memory, AI conversations, creative writing tools, and community support into a single web-based interface.

ReflectAI is not a therapy application and does not provide medical advice, diagnosis, or treatment. Its purpose is self-reflection, emotional awareness, creativity, and personal growth.

---

# Problem Statement Alignment

Students often experience stress, anxiety, academic pressure, uncertainty about the future, and emotional burnout.

Traditional journaling applications lack:

- Intelligent emotional analysis
- Personalized conversations
- Long-term memory
- Meaningful reflection
- Community support
- Creative expression tools

ReflectAI addresses these challenges through AI-powered emotional reflection and memory-aware conversations on the web.

---

# Core Objectives

1. Enable daily emotional journaling.
2. Analyze emotions using AI.
3. Provide personalized AI companionship.
4. Remember important user context across sessions.
5. Visualize emotional trends.
6. Encourage self-reflection and growth.
7. Support creative expression through poetry and writing.
8. Build a safe anonymous student community.

---

# User Role

## Student User

The primary user of the website.

Capabilities:

- Create journals
- View journal history
- Chat with AI companion
- View emotional analytics
- Share anonymously
- Interact with community posts
- Generate poetry
- Improve writing
- Create future letters

---

# Core Features

## Feature 1: Smart Journal

Users can:

- Create daily journal entries
- Edit journal entries
- Delete journal entries
- Add custom titles
- Search previous entries
- View complete journal history

Data Stored:

- Title
- Content
- Timestamp
- User ID

Every journal entry is automatically analyzed by AI.

---

## Feature 2: Emotion Detection

Purpose:

Analyze emotional state from journal entries.

AI Responsibilities:

- Detect dominant emotion
- Generate confidence score
- Generate emotional summary

Supported Emotions:

- Happy
- Sad
- Stressed
- Angry
- Excited
- Lonely
- Neutral

Example Output:

Emotion: Stressed

Confidence: 82%

Summary:
Academic workload appears to be the primary source of stress.

---

## Feature 3: AI Reflection Companion

This is the primary experience of ReflectAI.

The AI should behave like a thoughtful reflection companion.

Responsibilities:

- Ask meaningful follow-up questions
- Encourage self-reflection
- Help users explore emotions
- Provide supportive responses
- Create personalized conversations

The AI must never:

- Claim to be a therapist
- Diagnose conditions
- Provide medical advice

Example:

User:
"I feel stressed because of exams."

AI:
"You've mentioned academic pressure. What part of the exams feels most overwhelming right now?"

---

## Feature 4: Emotional Memory System

Purpose:

Allow AI to remember important user context across sessions.

Examples of Stored Memories:

- Preparing for semester exams
- Loves cricket
- Interested in poetry
- Concerned about career
- Wants to improve communication skills

Memory Categories:

- Interests
- Goals
- Concerns
- Positive Experiences
- Recurring Events

Behavior:

The AI should naturally reference relevant memories during future conversations.

Example:

"Last week you mentioned being worried about your exams. How are things progressing now?"

---

## Feature 5: Weekly Reflection Dashboard

Purpose:

Help users understand emotional patterns over time.

Dashboard Components:

- Mood Timeline
- Emotion Distribution Chart
- Weekly Reflection Summary
- Most Frequent Emotions
- Emotional Trend Indicators

Visualizations:

- Line Charts
- Pie Charts
- Trend Cards

---

## Feature 6: Anonymous Community

Purpose:

Provide a safe space for students to share reflections.

Posting Modes:

- Private
- Anonymous Community Post

Community Features:

- Create anonymous posts
- Browse community feed
- Support other users

Allowed Reactions:

❤️ Relate

🤝 Support

🌟 Inspire

No dislikes.
No public criticism.

Community should remain positive and supportive.

---

## Feature 7: Writing Assistant

Purpose:

Help users express themselves better.

Actions:

- Improve Expression
- Improve Vocabulary
- Correct Grammar
- Enhance Emotional Depth
- Rewrite Thoughtfully

Example:

Input:
"Today was difficult."

Output:
"Today felt heavier than expected, yet I found the strength to continue moving forward."

---

## Feature 8: Poetry Assistant

Purpose:

Convert emotions into creative expression.

Supported Modes:

- Free Verse
- Reflective Poetry
- Motivational Poetry
- Emotional Poetry

Workflow:

Journal Entry
→ Generate Poem
→ Save to Poetry Library

---

## Feature 9: Letter To Future Self

Purpose:

Promote long-term reflection and growth.

Users can write letters to their future selves.

Unlock Options:

- 1 Month
- 3 Months
- 6 Months
- 1 Year

Stored Data:

- Title
- Content
- Creation Date
- Unlock Date

Letters remain inaccessible until unlock date.

---

# AI Architecture

ReflectAI uses a Hybrid AI Architecture.

---

## Google Gemini

Gemini performs structured intelligence tasks.

Responsibilities:

- Emotion Detection
- Memory Extraction
- Weekly Reflection Summary
- Poetry Generation
- Writing Enhancement

---

## Kiwi LLM

Kiwi acts as the primary AI Reflection Companion.

Responsibilities:

- Personalized Conversations
- Emotional Reflection
- Follow-Up Questions
- Context-Aware Responses
- Long-Term Conversational Continuity

---

# Emotional Memory Pipeline

Step 1

User creates journal entry.

↓

Step 2

Gemini performs:

- Emotion Analysis
- Memory Extraction

↓

Step 3

Data stored in Firestore.

↓

Step 4

User starts AI conversation.

↓

Step 5

Backend retrieves:

- User Memories
- Recent Journals
- Recent Conversations

↓

Step 6

Context assembled.

↓

Step 7

Kiwi generates personalized response.

↓

Step 8

New memories extracted and stored.

---

# Database Schema

## users

- uid
- name
- email
- createdAt

---

## journal_entries

- id
- uid
- title
- content
- emotion
- confidence
- summary
- createdAt

---

## chat_history

- id
- uid
- role
- message
- timestamp

---

## community_posts

- id
- uid
- content
- anonymous
- relateCount
- supportCount
- inspireCount
- createdAt

---

## future_letters

- id
- uid
- title
- content
- unlockDate
- createdAt

---

## poems

- id
- uid
- originalJournalId
- generatedPoem
- style
- createdAt

---

# Technology Stack

Frontend:

- React.js / Flutter for Web

Backend:

- Node.js
- Express

Database:

- Firebase Firestore

Authentication:

- Firebase Authentication

Cloud Functions:

- Firebase Functions

Hosting:

- Firebase Hosting

Analytics:

- Firebase Analytics

Notifications:

- Web Push Notifications

AI:

- Google Gemini API
- Kiwi LLM API

---

# UI/UX Requirements

Design Principles:

- Calm
- Minimal
- Emotion-focused
- Modern
- Responsive Web Design

Requirements:

- Dark Mode
- Light Mode
- Smooth Web Animations
- Responsive Layouts (Desktop, Tablet, and Mobile views)
- Beautiful Data Visualizations

Color Theme:

Soft gradients and wellness-inspired palette.

---

# Security Requirements

- Firebase Authentication
- Secure API Keys
- User Data Isolation
- Firestore Security Rules
- Rate Limiting
- Input Validation

---

# Success Criteria

A successful implementation should allow a student to:

1. Write a journal.
2. Receive emotion analysis.
3. Chat with a memory-aware AI companion.
4. Track emotional growth.
5. Share anonymously.
6. Generate poetry.
7. Improve writing.
8. Write future letters.
9. Experience personalized long-term AI interactions over the web.

The final product should feel personal, supportive, intelligent, and emotionally meaningful.