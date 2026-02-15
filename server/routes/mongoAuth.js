const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'super_secret_key_change_me';

function makeToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body || {};
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    const exists = await User.findOne({ email: (email||'').toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    const user = await User.create({ name, mobile, email: email.toLowerCase(), passwordSalt: salt, passwordHash: hash });
    const token = makeToken({ scope: 'user', sub: user._id.toString() });
    return res.json({ success: true, message: 'Registration successful', token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });
    const user = await User.findOne({ email: (email||'').toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const hash = crypto.pbkdf2Sync(password, user.passwordSalt, 100000, 32, 'sha256').toString('hex');
    if (hash !== user.passwordHash) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = makeToken({ scope: 'user', sub: user._id.toString() });
    return res.json({ success: true, message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

module.exports = router;
