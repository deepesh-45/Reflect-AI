const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { enhanceWriting, generatePoem } = require('../services/geminiService');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/assistant/write-assist
 * @desc    Adjust and improve journal writing using Gemini
 */
router.post('/write-assist', async (req, res, next) => {
  const { text, action } = req.body; // action: 'Improve Expression', 'Improve Vocabulary', etc.

  if (!text || !action) {
    return res.status(400).json({ error: 'Text content and enhancement action are required' });
  }

  const validActions = [
    'Improve Expression',
    'Improve Vocabulary',
    'Correct Grammar',
    'Enhance Emotional Depth',
    'Rewrite Thoughtfully'
  ];

  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
  }

  try {
    console.log(`[Assistant] Enhancing text with action: ${action}...`);
    const enhancedText = await enhanceWriting(text, action);

    return res.json({
      original: text,
      action,
      enhanced: enhancedText
    });
  } catch (error) {
    console.error('Error in writing assistant:', error);
    next(error);
  }
});

/**
 * @route   POST /api/assistant/poetry
 * @desc    Generate a poem from text input (or from a saved journal entry) and save it to the poetry library
 */
router.post('/poetry', async (req, res, next) => {
  const { text, journalId, style } = req.body; // style: Free Verse, Reflective, Motivational, Emotional
  const uid = req.user.uid;

  if (!style) {
    return res.status(400).json({ error: 'Poetry style is required' });
  }

  let textToConvert = text;

  try {
    // If a journalId is provided, retrieve its content
    if (journalId) {
      const journalDoc = await db.collection('journal_entries').doc(journalId).get();
      if (!journalDoc.exists) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }
      
      const journalData = journalDoc.data();
      if (journalData.uid !== uid) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
      
      textToConvert = journalData.content;
    }

    if (!textToConvert || textToConvert.trim().length === 0) {
      return res.status(400).json({ error: 'No text content available to generate a poem' });
    }

    console.log(`[Assistant] Generating ${style} poem...`);
    const poemContent = await generatePoem(textToConvert, style);

    // Save poem to the library in Firestore
    const poemData = {
      uid,
      originalJournalId: journalId || null,
      generatedPoem: poemContent,
      style,
      createdAt: new Date()
    };

    const docRef = await db.collection('poems').add(poemData);

    return res.status(201).json({
      message: 'Poem generated and saved to library successfully',
      poem: { id: docRef.id, ...poemData }
    });
  } catch (error) {
    console.error('Error generating poetry:', error);
    next(error);
  }
});

/**
 * @route   GET /api/assistant/poetry
 * @desc    Fetch the saved poems library for the user
 */
router.get('/poetry', async (req, res, next) => {
  const uid = req.user.uid;

  try {
    const snapshot = await db.collection('poems')
      .where('uid', '==', uid)
      .get();

    const poems = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : new Date(data.createdAt);

      poems.push({
        id: doc.id,
        originalJournalId: data.originalJournalId,
        generatedPoem: data.generatedPoem,
        style: data.style,
        createdAt
      });
    });

    poems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json(poems);
  } catch (error) {
    console.error('Error fetching poetry library:', error);
    next(error);
  }
});

module.exports = router;
