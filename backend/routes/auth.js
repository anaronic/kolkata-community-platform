const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Tight limit on auth endpoints to slow OTP spam and brute force
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
router.use(authLimiter);

// Mock OTP sender
function sendOTP(phone, otp) {
  console.log(`Sending OTP ${otp} to phone ${phone}`);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  // Must be a string: rejects NoSQL operator objects like { "$ne": null }
  if (typeof phone !== 'string' || !/^\+?\d{10,15}$/.test(phone)) {
    return res.status(400).json({ message: 'Valid phone required' });
  }
  const otp = crypto.randomInt(100000, 1000000).toString();
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone });
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  await user.save();
  sendOTP(phone, otp);
  res.json({ message: 'OTP sent' });
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (typeof phone !== 'string' || typeof otp !== 'string') {
    return res.status(400).json({ message: 'Phone and OTP required' });
  }
  const user = await User.findOne({ phone });
  if (!user || !user.otp || !user.otpExpires || user.otpExpires < new Date()) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many attempts, request a new OTP' });
  }
  const a = Buffer.from(user.otp);
  const b = Buffer.from(otp);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    return res.status(401).json({ message: 'Invalid OTP' });
  }
  user.otp = null;
  user.otpExpires = null;
  user.otpAttempts = 0;
  await user.save();
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
  res.json({ token });
});

module.exports = router;
