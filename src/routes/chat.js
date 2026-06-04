const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { generateReflectionResponse } = require('../services/kiwiService');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/chat
 * @desc    Send a message to the AI Companion. Automatically aggregates long-term memories, recent journals, and chat logs to build a Kiwi prompt.
 */
router.post('/', async (req, res, next) => {
  const { message } = req.body;
  const uid = req.user.uid;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Retrieve all memories for the user
    const memoriesSnapshot = await db.collection('memories')
      .where('uid', '==', uid)
      .get();
    
    const memories = memoriesSnapshot.docs.map(doc => doc.data());

    // 2. Retrieve recent journals (past 5 entries)
    const journalsSnapshot = await db.collection('journal_entries')
      .where('uid', '==', uid)
      .get();
    
    const recentJournals = journalsSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const timeA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);

    // 3. Retrieve recent chat history (past 10 messages)
    const chatSnapshot = await db.collection('chat_history')
      .where('uid', '==', uid)
      .get();
    
    const chatHistory = chatSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const timeA = a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        return timeA - timeB;
      })
      .slice(-10);

    // 4. Send combined contextual prompt to Kiwi LLM
    console.log(`[Chat] Querying Kiwi LLM for user ${uid}...`);
    const aiResponseText = await generateReflectionResponse(
      uid,
      message,
      memories,
      recentJournals,
      chatHistory
    );

    // 5. Store user message in Firestore
    const userMsgRef = await db.collection('chat_history').add({
      uid,
      role: 'user',
      message,
      timestamp: new Date()
    });

    // 6. Store AI response in Firestore
    const aiMsgRef = await db.collection('chat_history').add({
      uid,
      role: 'model',
      message: aiResponseText,
      timestamp: new Date()
    });

    return res.json({
      reply: aiResponseText,
      history: [
        { id: userMsgRef.id, role: 'user', message, timestamp: new Date() },
        { id: aiMsgRef.id, role: 'model', message: aiResponseText, timestamp: new Date() }
      ]
    });
  } catch (error) {
    console.error('Error in AI companion chat:', error);
    next(error);
  }
});

/**
 * @route   GET /api/chat/history
 * @desc    Get the chat history of the user
 */
router.get('/history', async (req, res, next) => {
  const uid = req.user.uid;

  try {
    const chatSnapshot = await db.collection('chat_history')
      .where('uid', '==', uid)
      .get();
    
    const chatLogs = chatSnapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function'
        ? data.timestamp.toDate()
        : new Date(data.timestamp);

      return {
        id: doc.id,
        role: data.role,
        message: data.message,
        timestamp
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return res.json(chatLogs);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    next(error);
  }
});

/**
 * @route   DELETE /api/chat/history
 * @desc    Clear chat history for user
 */
router.delete('/history', async (req, res, next) => {
  const uid = req.user.uid;

  try {
    const chatSnapshot = await db.collection('chat_history')
      .where('uid', '==', uid)
      .get();

    for (const doc of chatSnapshot.docs) {
      await db.collection('chat_history').doc(doc.id).delete();
    }

    return res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    next(error);
  }
});

module.exports = router;
