const express = require('express');
const router = express.Router();

// Prototype pollution vulnerability
function deepMerge(target, source) {
  for (const key in source) {
    // Bug: No __proto__ or constructor check - allows prototype pollution
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// SQL Injection in search endpoint
router.get('/users/search', async (req, res) => {
  const { q, sort, order } = req.query;
  
  // Bug: Direct string interpolation in SQL
  const query = `SELECT * FROM users WHERE name LIKE '%${q}%' ORDER BY ${sort} ${order}`;
  
  try {
    const results = await req.db.query(query);
    res.json(results);
  } catch (err) {
    // Bug: Leaking internal error details to client
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Missing authentication check
router.delete('/users/:id', async (req, res) => {
  // Bug: No auth middleware - anyone can delete users
  const { id } = req.params;
  
  // Bug: SQL injection via parameter
  await req.db.query(`DELETE FROM users WHERE id = ${id}`);
  res.json({ deleted: true });
});

// Mass assignment vulnerability
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  // Bug: Directly using all request body fields - allows role escalation
  const updates = req.body;
  const setClauses = Object.entries(updates)
    .map(([key, value]) => `${key} = '${value}'`)
    .join(', ');
  
  await req.db.query(`UPDATE users SET ${setClauses} WHERE id = ${id}`);
  res.json({ updated: true });
});

// ReDoS vulnerability
router.post('/validate-email', (req, res) => {
  const { email } = req.body;
  
  // Bug: Catastrophic backtracking regex
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  
  if (emailRegex.test(email)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// Insecure file upload
router.post('/upload', async (req, res) => {
  const { filename, content } = req.body;
  
  // Bug: Path traversal - no sanitization of filename
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join('/uploads', filename);
  
  // Bug: No file type validation, no size limit
  fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
  res.json({ path: filePath });
});

// IDOR vulnerability
router.get('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  
  // Bug: No ownership check - any user can access any invoice
  const invoice = await req.db.query(`SELECT * FROM invoices WHERE id = ${id}`);
  
  // Bug: Includes sensitive payment details in response
  res.json(invoice);
});

// Broken rate limiting implementation
const rateLimitStore = {};
router.use('/api', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = { count: 1, start: now };
  } else {
    rateLimitStore[ip].count++;
  }
  
  // Bug: Never resets the window - permanently blocks after limit
  if (rateLimitStore[ip].count > 100) {
    return res.status(429).json({ error: 'Rate limited' });
  }
  
  next();
});

// Insecure data export
router.get('/export', async (req, res) => {
  // Bug: No auth check, exports ALL user data including passwords
  const users = await req.db.query('SELECT * FROM users');
  
  // Bug: XSS via CSV injection
  const csv = users.map(u => `${u.name},${u.email},${u.password}`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

module.exports = router;
