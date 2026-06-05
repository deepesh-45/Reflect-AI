export type MoodType = 'Happy' | 'Sad' | 'Stressed' | 'Angry' | 'Excited' | 'Lonely' | 'Neutral' | 'Calm' | 'Joy' | 'Anxious' | 'Pensive';

export interface EmotionResult {
  tags: string[];
  confidence: number;
  reflectionSummary: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: string;
  mood: MoodType;
  color: string;
  triggers?: string[];
  reflectionFeedback?: string;
  emotionAnalysis?: EmotionResult;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SavedPoem {
  id: string;
  style: 'Free Verse' | 'Reflective' | 'Motivational' | 'Emotional';
  content: string;
  originalThought: string;
  date: string;
}

export interface FutureLetter {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  unlockDate: string;
  duration: '1M' | '3M' | '6M' | '1Y' | 'test-1m';
  isLocked: boolean;
}

export interface CommunityPost {
  id: string;
  emotions: string[];
  content: string;
  timestamp: string;
  likes: number; // Relate
  supportCount: number; // Support
  inspireCount: number; // Inspire
  hasLiked?: boolean;
  hasSupported?: boolean;
  hasInspired?: boolean;
  isAnonymous: boolean;
  creatorName?: string;
}
