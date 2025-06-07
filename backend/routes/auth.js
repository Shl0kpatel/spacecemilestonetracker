const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper functions
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeJSONFile = (filename, data) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Register user
router.post('/register', (req, res) => {
  try {
    const { name, contact, username, password, role } = req.body;
    
    if (!name || !contact || !username || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['parent', 'volunteer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const users = readJSONFile('users.json');
    
    // Check if username or contact already exists
    const existingUser = users.find(user => 
      user.username === username || user.contact === contact
    );
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or contact already exists' });
    }

    // Create new user
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name,
      contact,
      username,
      password, // In real app, this would be hashed
      role
    };

    users.push(newUser);
    writeJSONFile('users.json', users);

    // Return user without password
    const { password: _, ...userResponse } = newUser;
    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = readJSONFile('users.json');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user without password
    const { password: _, ...userResponse } = user;
    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
