const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const TinderProfile = require('../models/TinderProfile');
const auth = require('../middleware/auth');

const SENTIMENT_URL = process.env.SENTIMENT_URL || 'http://localhost:8000';
const BASE_WEIGHT = 5; // weight of the external (baseStars) rating in the average

// GET /api/tinder-profiles (feedbacks excluded: unbounded and not needed by the UI)
router.get('/', async (req, res) => {
  const profiles = await TinderProfile.find().select('-feedbacks');
  res.json(profiles);
});

// POST /api/tinder-profiles (protected)
router.post('/', auth, async (req, res) => {
  const { name, age, bio, image } = req.body;
  const profile = new TinderProfile({ name, age, bio, image });
  await profile.save();
  res.status(201).json(profile);
});

// POST /api/tinder-profiles/:id/feedback (protected)
router.post('/:id/feedback', auth, async (req, res) => {
  const { swipeDirection, feedbackText, userStars } = req.body;
  const profileId = req.params.id;

  if (!mongoose.isValidObjectId(profileId)) return res.status(400).json({ message: 'Invalid profile id' });
  if (!['left', 'right'].includes(swipeDirection)) return res.status(400).json({ message: 'Invalid swipeDirection' });
  if (typeof feedbackText !== 'string' || feedbackText.length > 1000) return res.status(400).json({ message: 'Invalid feedbackText' });
  if (userStars != null && (typeof userStars !== 'number' || userStars < 1 || userStars > 5)) {
    return res.status(400).json({ message: 'userStars must be between 1 and 5' });
  }

  try {
    // Call Python NLP service (bounded wait so a slow/down service can't hang requests)
    const response = await fetch(`${SENTIMENT_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: feedbackText, swipeDirection, userStars }),
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return res.status(502).json({ message: 'Sentiment service error' });
    const { stars } = await response.json();

    // Single atomic update: append feedback and recompute the weighted average
    // server-side, so concurrent feedbacks cannot overwrite each other.
    const profile = await TinderProfile.findByIdAndUpdate(
      profileId,
      [
        { $set: { feedbacks: { $concatArrays: [{ $ifNull: ['$feedbacks', []] }, [{ swipeDirection, feedbackText, stars }]] } } },
        { $set: { averageStars: { $divide: [
          { $add: [{ $multiply: ['$baseStars', BASE_WEIGHT] }, { $sum: '$feedbacks.stars' }] },
          { $add: [BASE_WEIGHT, { $size: '$feedbacks' }] }
        ] } } }
      ],
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ stars, averageStars: profile.averageStars });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ message: 'Error processing feedback' });
  }
});

module.exports = router;
