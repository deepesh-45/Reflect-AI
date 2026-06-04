# ReflectAI Frontend Map

## Overview
ReflectAI is an AI-powered emotional reflection companion for students. This document maps the client-side modules, state entry points, and UI flows.

## Modules & Views
1. **Dashboard (Home)**: Weekly reflection trends, mood timeline, and emotion distribution.
2. **Smart Journal**: CRUD interface for entries with AI-detected emotion badges.
3. **AI Companion Chat**: Thoughtful conversational interface for deep reflection.
4. **Writing & Poetry Assistant**: Side-by-side editing tools for emotional expression and creative transformation.
5. **Community Feed**: Anonymous peer support network.
6. **Future Self**: Locked letter vault with countdown mechanisms.

## State Management Entry Points
- `user_mood_history`: Array of daily mood scores and emotion labels.
- `journal_entries`: Collection of journal objects {id, title, content, emotion_score, timestamp}.
- `chat_history`: Active reflection session messages.
- `community_posts`: Feed data with support counts and anonymity flags.
- `locked_letters`: Letters with `unlock_at` timestamps.

## API Configuration
Endpoints are managed via a centralized config:
- `POST /api/analyze-emotion`: Returns confidence scores and summaries.
- `POST /api/generate-reflection`: AI follow-up questions.
- `POST /api/writing-assist`: Rewriting and tone adjustment.
- `POST /api/generate-poetry`: Style-based poetic transformation.

## UI States
- **Idle**: Standard component state.
- **Loading**: Shimmer/skeleton screens for charts and feed.
- **Success**: Toast notifications for saved entries/letters.
- **Error**: Inline alerts with retry logic for AI services.
