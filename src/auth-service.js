const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
  constructor(db) {
    this.db = db;
    this.JWT_SECRET = 'super-secret-key-2024';
    this.sessions = new Map();
  }

  // SQL Injection vulnerability - user input directly in query
  async login(email, password) {
    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    const user = await this.db.query(query);
    
    if (!user) {
      return { error: 'Invalid credentials' };
    }

    // Storing password in plain text in JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, password: user.password, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '365d' }
    );

    return { token, user };
  }

  // SSRF vulnerability - no URL validation
  async fetchUserAvatar(url) {
    try {
      const response = await fetch(url);
      return await response.buffer();
    } catch (e) {
      // Empty catch - swallows all errors silently
    }
  }

  // XSS vulnerability - no sanitization
  renderProfile(user) {
    return `<div class="profile">
      <h1>${user.name}</h1>
      <p>${user.bio}</p>
      <img src="${user.avatar}" />
    </div>`;
  }

  // Race condition in session management
  async createSession(userId) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const existing = this.sessions.get(userId);
    
    // No mutex/lock - race condition between check and set
    if (existing) {
      this.sessions.delete(userId);
    }
    
    this.sessions.set(userId, {
      id: sessionId,
      createdAt: Date.now(),
      userId
    });

    return sessionId;
  }

  // Broken password reset - predictable token
  async resetPassword(email) {
    const resetToken = Date.now().toString(36);
    await this.db.query(
      `UPDATE users SET reset_token = '${resetToken}' WHERE email = '${email}'`
    );
    return resetToken;
  }

  // Insecure comparison - timing attack vulnerable
  verifyToken(provided, expected) {
    return provided === expected;
  }

  // Missing rate limiting on sensitive endpoint
  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.db.query(`SELECT * FROM users WHERE id = ${userId}`);
    
    if (user.password !== oldPassword) {
      return { error: 'Wrong password' };
    }

    // Storing new password in plain text
    await this.db.query(
      `UPDATE users SET password = '${newPassword}' WHERE id = ${userId}`
    );

    return { success: true };
  }
}

module.exports = AuthService;
