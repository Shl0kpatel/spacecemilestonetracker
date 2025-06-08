const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { uploadMedia } = require('../config/cloudinary');

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

// Helper function to validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Get parent dashboard data
router.get('/dashboard/:parentId', (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId);
    const children = readJSONFile('children.json');
    const milestones = readJSONFile('milestones.json');
    const milestoneStatus = readJSONFile('milestoneStatus.json');

    // Get children for this parent
    const parentChildren = children.filter(child => child.parentId === parentId);

    // Get milestone progress for each child
    const childrenWithProgress = parentChildren.map(child => {
      const relevantMilestones = milestones.filter(m => m.ageGroup === child.ageGroup);
      const childMilestoneStatus = milestoneStatus.filter(ms => ms.childId === child._id);
      
      const progress = {
        total: relevantMilestones.length,
        completed: childMilestoneStatus.filter(ms => ms.status === 'accepted').length,
        pending: childMilestoneStatus.filter(ms => ms.status === 'pending').length,
        rejected: childMilestoneStatus.filter(ms => ms.status === 'rejected').length
      };

      return {
        ...child,
        id: child._id, // Add id field for frontend compatibility
        progress,
        milestones: relevantMilestones.map(milestone => {
          const status = childMilestoneStatus.find(ms => ms.milestoneId === milestone._id);
          return {
            ...milestone,
            id: milestone._id, // Add id field for frontend compatibility
            status: status ? status.status : 'not_started',
            submissionId: status ? status._id : null,
            mediaUrl: status ? status.mediaUrl : null,
            submittedAt: status ? status.submittedAt : null,
            feedback: status ? status.feedback : null
          };
        })
      };
    });

    res.json({
      children: childrenWithProgress
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get milestones for a specific child
router.get('/child/:childId/milestones', (req, res) => {
  try {
    const childId = req.params.childId; // Keep as string since _id is string
    const children = readJSONFile('children.json');
    const milestones = readJSONFile('milestones.json');
    const milestoneStatus = readJSONFile('milestoneStatus.json');

    const child = children.find(c => c._id === childId);
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Get age group filter from query params
    const ageGroupFilter = req.query.ageGroup;
    let relevantMilestones = milestones.filter(m => m.ageGroup === child.ageGroup);
    
    if (ageGroupFilter && ageGroupFilter !== 'all') {
      relevantMilestones = relevantMilestones.filter(m => m.ageGroup === ageGroupFilter);
    }

    const childMilestoneStatus = milestoneStatus.filter(ms => ms.childId === childId);

    const milestonesWithStatus = relevantMilestones.map(milestone => {
      const status = childMilestoneStatus.find(ms => ms.milestoneId === milestone._id);
      return {
        ...milestone,
        id: milestone._id, // Add id field for frontend compatibility
        status: status ? status.status : 'not_started',
        submissionId: status ? status._id : null,
        mediaUrl: status ? status.mediaUrl : null,
        submittedAt: status ? status.submittedAt : null,
        feedback: status ? status.feedback : null
      };
    });

    res.json({
      child,
      milestones: milestonesWithStatus
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit milestone with file upload (NEW)
router.post('/milestone/submit-with-file', uploadMedia.single('media'), (req, res) => {
  try {
    console.log('=== FILE UPLOAD MILESTONE SUBMISSION ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { childId, milestoneId } = req.body;
    
    if (!childId || !milestoneId) {
      return res.status(400).json({ error: 'Child ID and Milestone ID are required' });
    }

    const children = readJSONFile('children.json');
    const milestones = readJSONFile('milestones.json');
    const milestoneStatus = readJSONFile('milestoneStatus.json');

    // Verify child and milestone exist
    const child = children.find(c => c._id === childId);
    const milestone = milestones.find(m => m._id === milestoneId);

    if (!child || !milestone) {
      return res.status(404).json({ error: 'Child or milestone not found' });
    }

    // Check if milestone already submitted
    const existingSubmission = milestoneStatus.find(
      ms => ms.childId === childId && ms.milestoneId === milestoneId
    );

    if (existingSubmission) {
      return res.status(409).json({ error: 'Milestone already submitted' });
    }

    // Get file URL from Cloudinary upload
    const mediaUrl = req.file ? req.file.path : null;
    const fileType = req.file ? req.file.mimetype : null;
    const fileName = req.file ? req.file.original_filename : null;
    const fileSize = req.file ? (req.file.size / (1024 * 1024)).toFixed(2) : null; // Size in MB

    // Create new milestone status entry
    const newSubmission = {
      _id: 'ms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      childId: childId,
      milestoneId: milestoneId,
      status: 'pending',
      mediaUrl: mediaUrl,
      mediaType: fileType ? (fileType.startsWith('image/') ? 'image' : 'video') : null,
      mediaSize: fileSize ? parseFloat(fileSize) : null,
      mediaDuration: null, // Will be set by Cloudinary for videos
      fileName: fileName,
      fileType: fileType,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      feedback: null
    };

    milestoneStatus.push(newSubmission);
    writeJSONFile('milestoneStatus.json', milestoneStatus);

    res.status(201).json({
      message: 'Milestone submitted successfully with file upload',
      submission: newSubmission
    });
  } catch (error) {
    console.error('File upload submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit milestone with media URL (LEGACY - keeping for backward compatibility)
router.post('/milestone/submit', (req, res) => {
  try {
    console.log('=== MILESTONE SUBMISSION DEBUG ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { childId, milestoneId, mediaUrl } = req.body;
    
    console.log('Extracted values:');
    console.log('- childId:', childId, '(type:', typeof childId, ')');
    console.log('- milestoneId:', milestoneId, '(type:', typeof milestoneId, ')');
    console.log('- mediaUrl:', mediaUrl, '(type:', typeof mediaUrl, ')');
    console.log('===============================');
    
    if (!childId || !milestoneId) {
      console.log('Missing required fields:', { childId: !!childId, milestoneId: !!milestoneId });
      return res.status(400).json({ error: 'Child ID and Milestone ID are required' });
    }

    // Validate media URL if provided
    if (mediaUrl && !isValidUrl(mediaUrl)) {
      return res.status(400).json({ error: 'Invalid media URL format' });
    }

    const children = readJSONFile('children.json');
    const milestones = readJSONFile('milestones.json');
    const milestoneStatus = readJSONFile('milestoneStatus.json');

    // Verify child and milestone exist
    const child = children.find(c => c._id === childId);
    const milestone = milestones.find(m => m._id === milestoneId);

    if (!child || !milestone) {
      return res.status(404).json({ error: 'Child or milestone not found' });
    }

    // Check if milestone already submitted
    const existingSubmission = milestoneStatus.find(
      ms => ms.childId === childId && ms.milestoneId === milestoneId
    );

    if (existingSubmission) {
      return res.status(409).json({ error: 'Milestone already submitted' });
    }

    // Create new milestone status entry
    const newSubmission = {
      _id: 'ms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      childId: childId,
      milestoneId: milestoneId,
      status: 'pending',
      mediaUrl: mediaUrl || null,
      mediaType: null,
      mediaSize: null,
      mediaDuration: null,
      fileName: null,
      fileType: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      feedback: null
    };

    milestoneStatus.push(newSubmission);
    writeJSONFile('milestoneStatus.json', milestoneStatus);

    res.status(201).json({
      message: 'Milestone submitted successfully',
      submission: newSubmission
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submission history for a child
router.get('/child/:childId/submissions', (req, res) => {
  try {
    const childId = req.params.childId; // Keep as string since _id is string
    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const milestones = readJSONFile('milestones.json');

    const childSubmissions = milestoneStatus.filter(ms => ms.childId === childId);

    const submissionsWithDetails = childSubmissions.map(submission => {
      const milestone = milestones.find(m => m._id === submission.milestoneId);
      return {
        ...submission,
        milestoneTitle: milestone ? milestone.title : 'Unknown Milestone',
        milestoneDescription: milestone ? milestone.description : ''
      };
    });

    res.json(submissionsWithDetails);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test file upload endpoint (for debugging)
router.post('/test-upload', (req, res) => {
  uploadMedia.single('media')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: err.message,
        details: err.toString(),
        code: err.code
      });
    }

    try {
      console.log('=== TEST UPLOAD ===');
      console.log('Uploaded file:', req.file);
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.json({
        message: 'File uploaded successfully',
        file: {
          url: req.file.path,
          type: req.file.mimetype,
          size: req.file.size,
          filename: req.file.original_filename
        }
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack 
      });
    }
  });
});

module.exports = router;
