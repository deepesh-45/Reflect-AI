const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/letters
 * @desc    Write a new letter to future self, sets unlockDate based on selected period
 */
router.post('/', async (req, res, next) => {
  const { title, content, unlockOption } = req.body; // unlockOption: '1M', '3M', '6M', '1Y' or numeric days
  const uid = req.user.uid;

  if (!title || !content || !unlockOption) {
    return res.status(400).json({ error: 'Title, content, and unlock option are required' });
  }

  try {
    const createdAt = new Date();
    let unlockDate = new Date();

    switch (unlockOption) {
      case '1M':
        unlockDate.setMonth(unlockDate.getMonth() + 1);
        break;
      case '3M':
        unlockDate.setMonth(unlockDate.getMonth() + 3);
        break;
      case '6M':
        unlockDate.setMonth(unlockDate.getMonth() + 6);
        break;
      case '1Y':
        unlockDate.setFullYear(unlockDate.getFullYear() + 1);
        break;
      case 'test-1m': // for testing: unlock in 1 minute
        unlockDate.setMinutes(unlockDate.getMinutes() + 1);
        break;
      default:
        // Assume numeric days if passed
        const days = parseInt(unlockOption, 10);
        if (!isNaN(days) && days > 0) {
          unlockDate.setDate(unlockDate.getDate() + days);
        } else {
          return res.status(400).json({ error: 'Invalid unlock option. Use 1M, 3M, 6M, 1Y, or positive number of days.' });
        }
    }

    const letterData = {
      uid,
      title,
      content,
      createdAt,
      unlockDate
    };

    const docRef = await db.collection('future_letters').add(letterData);

    return res.status(201).json({
      message: `Letter to future self created successfully. Locked until ${unlockDate.toLocaleString()}.`,
      letter: {
        id: docRef.id,
        title,
        locked: true,
        unlockDate,
        createdAt
      }
    });
  } catch (error) {
    console.error('Error writing letter:', error);
    next(error);
  }
});

/**
 * @route   GET /api/letters
 * @desc    Get all future-self letters for user (masking content for locked items)
 */
router.get('/', async (req, res, next) => {
  const uid = req.user.uid;
  const now = new Date();

  try {
    const snapshot = await db.collection('future_letters')
      .where('uid', '==', uid)
      .get();

    const letters = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : new Date(data.createdAt);
      
      const unlockDate = data.unlockDate && typeof data.unlockDate.toDate === 'function'
        ? data.unlockDate.toDate()
        : new Date(data.unlockDate);

      const isLocked = now < new Date(unlockDate);

      letters.push({
        id: doc.id,
        title: data.title,
        createdAt,
        unlockDate,
        locked: isLocked,
        // Enforce security: Content is never returned if locked
        content: isLocked ? '[Content Locked. Your future self cannot open this yet.]' : data.content
      });
    });

    letters.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json(letters);
  } catch (error) {
    console.error('Error fetching letters:', error);
    next(error);
  }
});

/**
 * @route   GET /api/letters/:id
 * @desc    Retrieve a specific future-self letter (strictly blocking content if locked)
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const uid = req.user.uid;
  const now = new Date();

  try {
    const docRef = db.collection('future_letters').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    const data = doc.data();
    if (data.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
      ? data.createdAt.toDate()
      : data.createdAt;
    
    const unlockDate = data.unlockDate && typeof data.unlockDate.toDate === 'function'
      ? data.unlockDate.toDate()
      : data.unlockDate;

    const isLocked = now < new Date(unlockDate);

    if (isLocked) {
      return res.status(403).json({
        error: 'Access Denied: This letter is locked',
        locked: true,
        unlockDate,
        message: 'This letter remains sealed. You cannot access it until the unlock date passes.'
      });
    }

    return res.json({
      id: doc.id,
      title: data.title,
      content: data.content,
      locked: false,
      createdAt,
      unlockDate
    });
  } catch (error) {
    console.error('Error fetching letter details:', error);
    next(error);
  }
});

module.exports = router;
