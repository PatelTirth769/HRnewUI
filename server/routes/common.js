const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

const API_AUTH_USER = process.env.API_AUTH_USER || 'hr_hovercraft';
const API_AUTH_PASS = process.env.API_AUTH_PASS || 'Admin@#12345$938@123%';
const API_AUTH_KEY = process.env.API_AUTH_KEY || '345n3b4mn5';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'super_secret_key_change_me';

function makeToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch (_) { return null; }
}

router.post('/apiAuth', (req, res) => {
  const { user, pass, key } = req.body || {};
  if (user === API_AUTH_USER && pass === API_AUTH_PASS && key === API_AUTH_KEY) {
    const token = makeToken({ scope: 'api' });
    return res.json({ responseStatus: 'Ok', token });
  }
  return res.status(401).json({ responseStatus: 'Fail', message: 'Invalid API credentials' });
});

router.post('/userAuth', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer || !verifyToken(bearer) || verifyToken(bearer).scope !== 'api') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing credentials' });
    }
    const user = await User.findOne({ email: (username||'').toLowerCase() });
    if (!user) return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    const hash = crypto.pbkdf2Sync(password, user.passwordSalt, 100000, 32, 'sha256').toString('hex');
    if (hash !== user.passwordHash) return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    const userToken = makeToken({ scope: 'user', sub: user._id.toString() });
    const userData = { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role };
    return res.json({ responseStatus: 'Ok', userToken, userData, message: 'Login successful' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
});

router.post('/sendOtp', (req, res) => {
  const otp = (Math.floor(1000 + Math.random() * 9000)).toString();
  return res.json({ status: true, otp });
});

router.post('/send-mail', (req, res) => {
  return res.json({ status: true });
});

module.exports = router;
