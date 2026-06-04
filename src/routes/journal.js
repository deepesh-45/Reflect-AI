const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { detectEmotion, extractMemories } = require('../services/geminiService');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/journal
 * @desc    Create a new journal entry, triggers Gemini emotion detection and memory extraction
 */
router.post('/', async (req, res, next) => {
  const { title, content } = req.body;
  const uid = req.user.uid;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    // 1. Analyze emotion using Gemini
    console.log(`[Journal] Analyzing emotion for user ${uid}...`);
    const analysis = await detectEmotion(content);

    // 2. Extract long-term memories using Gemini
    console.log(`[Journal] Extracting memories for user ${uid}...`);
    const extracted = await extractMemories(content);

    const entryData = {
      uid,
      title,
      content,
      emotion: analysis.emotion,
      confidence: analysis.confidence,
      summary: analysis.summary,
      createdAt: new Date()
    };

    // 3. Store journal entry in Firestore
    const journalRef = await db.collection('journal_entries').add(entryData);
    const entryId = journalRef.id;

    // 4. Store extracted memories in Firestore
    if (Array.isArray(extracted) && extracted.length > 0) {
      console.log(`[Journal] Storing ${extracted.length} memories...`);
      for (const item of extracted) {
        await db.collection('memories').add({
          uid,
          content: item.content,
          category: item.category,
          originalJournalId: entryId,
          createdAt: new Date()
        });
      }
    }

    return res.status(201).json({
      message: 'Journal entry created successfully',
      entry: { id: entryId, ...entryData }
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    next(error);
  }
});

/**
 * @route   GET /api/journal
 * @desc    Get all journal entries for the authenticated user (supports search query)
 */
router.get('/', async (req, res, next) => {
  const uid = req.user.uid;
  const { search } = req.query;

  try {
    const snapshot = await db.collection('journal_entries')
      .where('uid', '==', uid)
      .get();

    let entries = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Ensure date conversion from Firestore timestamps
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function' 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt);
      
      entries.push({ id: doc.id, ...data, createdAt });
    });

    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Local filter if search term is provided
    if (search) {
      const query = search.toLowerCase();
      entries = entries.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.content.toLowerCase().includes(query)
      );
    }

    return res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    next(error);
  }
});

/**
 * @route   GET /api/journal/:id
 * @desc    Get details of a specific journal entry
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const docRef = db.collection('journal_entries').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const data = doc.data();
    if (data.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: Access denied to this entry' });
    }

    const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function' 
      ? data.createdAt.toDate() 
      : data.createdAt;

    return res.json({ id: doc.id, ...data, createdAt });
  } catch (error) {
    console.error('Error fetching journal entry detail:', error);
    next(error);
  }
});

/**
 * @route   PUT /api/journal/:id
 * @desc    Update a journal entry, triggers re-analysis of emotion and memory
 */
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const uid = req.user.uid;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const docRef = db.collection('journal_entries').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const currentData = doc.data();
    if (currentData.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // Re-analyze emotion and memories
    console.log(`[Journal] Re-analyzing updated content for entry ${id}...`);
    const analysis = await detectEmotion(content);
    const extracted = await extractMemories(content);

    const updateData = {
      title,
      content,
      emotion: analysis.emotion,
      confidence: analysis.confidence,
      summary: analysis.summary,
      updatedAt: new Date()
    };

    await docRef.update(updateData);

    // Update/Replace memories associated with this entry
    // Clean old memories first
    const memoriesSnapshot = await db.collection('memories')
      .where('originalJournalId', '==', id)
      .get();
    
    for (const memDoc of memoriesSnapshot.docs) {
      await db.collection('memories').doc(memDoc.id).delete();
    }

    // Store new memories
    if (Array.isArray(extracted) && extracted.length > 0) {
      for (const item of extracted) {
        await db.collection('memories').add({
          uid,
          content: item.content,
          category: item.category,
          originalJournalId: id,
          createdAt: new Date()
        });
      }
    }

    return res.json({
      message: 'Journal entry updated successfully',
      entry: { id, ...currentData, ...updateData }
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    next(error);
  }
});

/**
 * @route   DELETE /api/journal/:id
 * @desc    Delete a journal entry and its extracted memories
 */
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const docRef = db.collection('journal_entries').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    if (doc.data().uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // 1. Delete journal entry
    await docRef.delete();

    // 2. Delete related memories
    const memoriesSnapshot = await db.collection('memories')
      .where('originalJournalId', '==', id)
      .get();
    
    for (const memDoc of memoriesSnapshot.docs) {
      await db.collection('memories').doc(memDoc.id).delete();
    }

    return res.json({ message: 'Journal entry and its associated memories deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    next(error);
  }
});

module.exports = router;
