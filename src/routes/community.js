const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/community
 * @desc    Create a new community post (can toggle anonymous)
 */
router.post('/', async (req, res, next) => {
  const { content, anonymous } = req.body;
  const uid = req.user.uid;

  if (!content) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  try {
    const postData = {
      uid,
      name: req.user.name,
      content,
      anonymous: !!anonymous,
      relateCount: 0,
      supportCount: 0,
      inspireCount: 0,
      createdAt: new Date()
    };

    const docRef = await db.collection('community_posts').add(postData);

    return res.status(201).json({
      message: 'Post shared with community successfully',
      post: { id: docRef.id, ...postData }
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    next(error);
  }
});

/**
 * @route   GET /api/community
 * @desc    Get all community posts (masking creator if anonymous)
 */
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db.collection('community_posts')
      .orderBy('createdAt', 'desc')
      .get();

    const posts = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : data.createdAt;

      // Mask creator's credentials if post is anonymous
      const creatorName = data.anonymous ? 'Anonymous Companion' : (data.name || 'Anonymous Student');
      
      posts.push({
        id: doc.id,
        content: data.content,
        anonymous: data.anonymous,
        creator: data.anonymous ? null : data.uid,
        creatorName,
        relateCount: data.relateCount || 0,
        supportCount: data.supportCount || 0,
        inspireCount: data.inspireCount || 0,
        createdAt
      });
    });

    return res.json(posts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    next(error);
  }
});

/**
 * @route   POST /api/community/:id/react
 * @desc    Add a reaction to a post (relate, support, inspire) - positive reactions only!
 */
router.post('/:id/react', async (req, res, next) => {
  const { id } = req.params;
  const { reactionType } = req.body; // must be "relate", "support", or "inspire"

  if (!['relate', 'support', 'inspire'].includes(reactionType)) {
    return res.status(400).json({ error: 'Invalid reaction type. Only positive reactions allowed: relate, support, inspire.' });
  }

  try {
    const docRef = db.collection('community_posts').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const data = doc.data();
    const countField = `${reactionType}Count`;
    const newCount = (data[countField] || 0) + 1;

    await docRef.update({
      [countField]: newCount
    });

    return res.json({
      message: `Reacted with ${reactionType}`,
      postId: id,
      reactionType,
      newCount
    });
  } catch (error) {
    console.error('Error updating community post reaction:', error);
    next(error);
  }
});

module.exports = router;
