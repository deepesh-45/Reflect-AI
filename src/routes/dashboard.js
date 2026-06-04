const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { generateWeeklySummary } = require('../services/geminiService');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/dashboard
 * @desc    Compile student emotional analytics dashboard (Timeline, Distribution, AI Summary, Streak)
 */
router.get('/', async (req, res, next) => {
  const uid = req.user.uid;
  const now = new Date();
  
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // 1. Fetch all entries for this user
    let snapshot = await db.collection('journal_entries')
      .where('uid', '==', uid)
      .get();

    const allEntries = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : new Date(data.createdAt);
      return { id: doc.id, ...data, createdAt };
    });

    // Filter for entries from the past 7 days, sorted chronological (asc)
    let entries = allEntries
      .filter(e => e.createdAt >= sevenDaysAgo)
      .sort((a, b) => a.createdAt - b.createdAt);

    // Fallback: if user has no entries in the last 7 days, grab their latest 5 entries overall so dashboard has data
    if (entries.length === 0) {
      entries = [...allEntries]
        .sort((a, b) => b.createdAt - a.createdAt) // newest first
        .slice(0, 5)
        .reverse(); // Maintain chronological order for timeline
    }

    // 2. Generate Emotion Distribution Map & Most Frequent Emotions
    const emotionCounts = {};
    let totalConfidenceSum = 0;
    
    entries.forEach(e => {
      const emo = e.emotion || 'Neutral';
      emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
      totalConfidenceSum += (e.confidence || 50);
    });

    const emotionDistribution = Object.keys(emotionCounts).map(name => ({
      name,
      count: emotionCounts[name],
      percentage: Math.round((emotionCounts[name] / entries.length) * 100)
    }));

    // Find primary mood
    let primaryEmotion = 'Neutral';
    let maxCount = 0;
    Object.keys(emotionCounts).forEach(emo => {
      if (emotionCounts[emo] > maxCount) {
        maxCount = emotionCounts[emo];
        primaryEmotion = emo;
      }
    });

    // Average emotional confidence
    const averageConfidence = entries.length > 0 
      ? Math.round(totalConfidenceSum / entries.length) 
      : 0;

    // 3. Compile Mood Timeline for the chart
    const moodTimeline = entries.map(e => ({
      date: e.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      emotion: e.emotion,
      confidence: e.confidence,
      title: e.title
    }));

    // 4. Calculate Reflection Streak (consecutive days of journaling)
    const sortedForStreak = [...allEntries].sort((a, b) => b.createdAt - a.createdAt);
    
    const allJournalDates = sortedForStreak.map(e => {
      const dateObj = new Date(e.createdAt);
      // Reset hours to compare dates only
      dateObj.setHours(0, 0, 0, 0);
      return dateObj.getTime();
    });

    // Remove duplicates
    const uniqueDates = [...new Set(allJournalDates)];
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // If today has no entry, check yesterday to start streak count
    if (uniqueDates.length > 0 && uniqueDates[0] !== checkDate.getTime()) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates.includes(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // step back one day
      } else {
        break; // streak broken
      }
    }

    // 5. Generate Weekly Reflection Summary via Gemini
    console.log(`[Dashboard] Generating weekly summary for user ${uid}...`);
    const weeklyReflection = await generateWeeklySummary(entries);

    // 6. Assemble Dashboard response
    return res.json({
      summary: weeklyReflection,
      streak,
      analytics: {
        totalEntries: entries.length,
        primaryEmotion,
        averageConfidence,
        emotionDistribution,
        moodTimeline
      }
    });
  } catch (error) {
    console.error('Error generating dashboard analytics:', error);
    next(error);
  }
});

module.exports = router;
