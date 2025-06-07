const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Read JSON file helper
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

// Write JSON file helper
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

// Get all milestones
router.get('/milestones', (req, res) => {
  const milestones = readJSONFile('milestones.json');
  res.json(milestones);
});

// Get all children
router.get('/children', (req, res) => {
  const children = readJSONFile('children.json');
  res.json(children);
});

// Get children for a parent (you'll need to implement parent authentication)
router.get('/children/:parentId', (req, res) => {
  const children = readJSONFile('children.json');
  const parentChildren = children.filter(child => child.parentId == req.params.parentId);
  res.json(parentChildren);
});

// Submit milestone status
router.post('/milestone-status', (req, res) => {
  try {
    const { childId, milestoneId, mediaUrl, mediaType, mediaSize, mediaDuration } = req.body;
    
    // Validation
    if (!childId || !milestoneId || !mediaUrl || !mediaType || !mediaSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Read existing milestone statuses
    const milestoneStatuses = readJSONFile('milestoneStatus.json');
    
    // Create new milestone status
    const newMilestoneStatus = {
      _id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      childId,
      milestoneId,
      mediaUrl,
      mediaType,
      mediaSize: parseFloat(mediaSize),
      mediaDuration: mediaType === 'video' && mediaDuration ? parseFloat(mediaDuration) : null,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      submittedAt: new Date().toISOString()
    };

    // Add to array
    milestoneStatuses.push(newMilestoneStatus);
    
    // Save to file
    if (writeJSONFile('milestoneStatus.json', milestoneStatuses)) {
      res.status(201).json({
        message: 'Milestone status submitted successfully',
        data: newMilestoneStatus
      });
    } else {
      res.status(500).json({ error: 'Failed to save milestone status' });
    }
  } catch (error) {
    console.error('Error submitting milestone status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get milestone statuses for a child
router.get('/milestone-status/:childId', (req, res) => {
  const milestoneStatuses = readJSONFile('milestoneStatus.json');
  const childStatuses = milestoneStatuses.filter(status => status.childId == req.params.childId);
  res.json(childStatuses);
});

module.exports = router;
