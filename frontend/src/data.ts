import { JournalEntry, CommunityPost, SavedPoem, FutureLetter } from './types';

export const INITIAL_REFLECTIONS: JournalEntry[] = [
  {
    id: "ref-1",
    title: "Evening Wind Down",
    content: "Reflecting on a surprisingly productive day despite the early morning rain. Felt centered during the afternoon meetings. Took some quiet moments to admire the droplets on the glass, finding a steady rhythm in a busy weekday schedule.",
    date: "Today, 8:45 PM",
    timestamp: new Date().toISOString(),
    mood: "Calm",
    color: "#5d5b78", // secondary / slate-indigo
    emotionAnalysis: {
      tags: ["Calm", "Reflective"],
      confidence: 96,
      reflectionSummary: "A serene moment of looking inward. Your writing suggests a deep connection to your daily flow, remaining steady despite external chaos."
    }
  },
  {
    id: "ref-2",
    title: "Pre-Meeting Jitters",
    content: "Nervous about presenting the new quarterly roadmap. Need to remember my breathing exercises before joining the call. My hands are a bit cold, but I know that preparation is on my side. Grounding my feet now.",
    date: "Yesterday, 9:30 AM",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    mood: "Anxious",
    color: "#805437", // warm-brown
    emotionAnalysis: {
      tags: ["Anxious", "Determined"],
      confidence: 88,
      reflectionSummary: "Your focus is strong. The nervousness is a sign of your commitment. Grounding yourself in physical breathing is a wonderful strategy."
    }
  },
  {
    id: "ref-3",
    title: "Coffee Walk",
    content: "Took a 15-minute break to walk to the local cafe. The crisp air and sudden realization of a solution to yesterday's problem felt great. Sometimes taking a step back is exactly how we move forward.",
    date: "Mon, 2:15 PM",
    timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    mood: "Joy",
    color: "#496457", // sage
    emotionAnalysis: {
      tags: ["Joy", "Focused"],
      confidence: 92,
      reflectionSummary: "A beautiful break that sparked creativity. Stepping away allowed your mind to connect the dots in a relaxed state."
    }
  }
];

export const INITIAL_POEMS: SavedPoem[] = [
  {
    id: "poem-1",
    style: "Reflective",
    content: `The quiet morning holds the weight,
of words unspoken, dreams awake.
A gentle breath against the glass,
watching the fleeting moments pass...`,
    originalThought: "I sat by the window in the early morning watching the mist clear. I have a lot on my mind but it felt peaceful for a second.",
    date: "Oct 12"
  },
  {
    id: "poem-2",
    style: "Free Verse",
    content: `Waves crashing not on shore, but mind.
A cascade of fragmented light.
I am the anchor and the storm,
seeking a shape, returning to form.`,
    originalThought: "Thoughts are really chaotic today, swirling in my mind like water. Trying to find my ground and figure out who I am right now.",
    date: "Oct 09"
  },
  {
    id: "poem-3",
    style: "Motivational",
    content: `Rise from the ash of yesterday's doubt,
let the fire within finally breathe out.
The mountain is steep, the path is unclear,
but the summit is calling, the summit is near.`,
    originalThought: "Feeling tired from failing, but I have to keep going. The tests are difficult but I want to reach the goal. I believe in myself.",
    date: "Oct 05"
  }
];

export const INITIAL_LETTERS: FutureLetter[] = [
  {
    id: "letter-1",
    title: "Letter to midterms",
    content: "Dear Future Me, I hope you survived the grueling midterm week. Did we manage to keep our sleep hygiene? Remember to take a break even if the load feels heavy. Tell me we got our sanity intact!",
    createdAt: "Sept 1, 2023",
    unlockDate: "Dec 24, 2026",
    duration: "3M",
    isLocked: true
  },
  {
    id: "letter-2",
    title: "New Year Intentions",
    content: "Dear Future Me, Looking forward to the whole year ahead. How are the exercise routines? Keep being compassionate with yourself when things go sideways. Wishing you gentle growth.",
    createdAt: "Jan 1, 2023",
    unlockDate: "Jan 1, 2027",
    duration: "1Y",
    isLocked: true
  },
  {
    id: "letter-3",
    title: "Freshman Year Worries",
    content: "Dear Me, I am currently shaking in my boots on day one of campus. Everything is so big and I do not know anyone in my dorm. I hope that by the time you open this, you have deep friendships and a regular coffee spot. You survived!",
    createdAt: "Aug 2022",
    unlockDate: "Jun 2, 2026",
    duration: "6M",
    isLocked: false
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    emotions: ["Overwhelmed"],
    content: "Feeling a bit lost today with all the upcoming deadlines. It's hard to remember why I started this journey in the first place when the day-to-day gets this heavy. Just trying to breathe through it.",
    timestamp: "2 hours ago",
    likes: 24,
    supportCount: 12,
    inspireCount: 1,
    isAnonymous: true
  },
  {
    id: "post-2",
    emotions: ["Breakthrough"],
    content: "I finally understood a concept I've been struggling with for weeks. It feels like a fog has lifted. Remember that persistence actually pays off, even when it feels like you're hitting a wall.",
    timestamp: "5 hours ago",
    likes: 56,
    supportCount: 8,
    inspireCount: 15,
    isAnonymous: true,
    hasLiked: true,
    hasSupported: true
  }
];
