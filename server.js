const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// File path for storing tips
const TIPS_FILE = path.join(__dirname, 'tips.json');

// Endpoint to get tips
app.get('/api/tips', (req, res) => {
  fs.readFile(TIPS_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.json([]);
    }
    try {
      const tips = JSON.parse(data);
      res.json(tips);
    } catch (parseErr) {
      console.error('Error parsing tips file:', parseErr);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// Endpoint to post a new tip
app.post('/api/tips', (req, res) => {
  const { name, content } = req.body;

  // Validate input
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const tip = {
    name: name || 'Anonymous',
    content: content.trim(),
    date: new Date(),
    reactions: { like: 0, love: 0 }
  };

  // Read existing tips
  fs.readFile(TIPS_FILE, 'utf8', (err, data) => {
    let tips = [];
    if (!err) {
      try {
        tips = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing tips file:', parseErr);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
    tips.unshift(tip);
    // Write updated tips back to file
    fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to tips file:', writeErr);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json(tip);
    });
  });
});

// Endpoint to update reactions
app.post('/api/tips/:index/reactions', (req, res) => {
  const index = parseInt(req.params.index);
  const { type } = req.body;

  if (!['like', 'love'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  // Read existing tips
  fs.readFile(TIPS_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    try {
      const tips = JSON.parse(data);
      if (!tips[index]) {
        return res.status(404).json({ error: 'Tip not found' });
      }
      tips[index].reactions[type]++;
      // Write updated tips back to file
      fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Error writing to tips file:', writeErr);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ success: true });
      });
    } catch (parseErr) {
      console.error('Error parsing tips file:', parseErr);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
