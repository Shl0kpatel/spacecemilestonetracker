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

// Submit milestone with file upload (NEW) - with Multer error handling
router.post('/milestone/submit-with-file', (req, res) => {
  uploadMedia.single('media')(req, res, function (err) {
    if (err) {
      // Multer or Cloudinary error
      console.error('Multer/Cloudinary error:', err);
      return res.status(500).json({ error: 'File upload error', details: err.message || err });
    }
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
      const fileName = req.file ? req.file.originalname : null;
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
      res.status(500).json({ error: 'Internal server error', details: error.message || error });
    }
  });
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

// Raise a ticket from parent
router.post('/ticket', (req, res) => {
  try {
    const { parentId, message } = req.body;
    if (!parentId || !message || !message.trim()) {
      return res.status(400).json({ error: 'Parent ID and message are required' });
    }
    const users = readJSONFile('users.json');
    const parent = users.find(u => u.id === parentId && u.role === 'parent');
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    const tickets = readJSONFile('tickets.json');
    const newTicket = {
      _id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      parentId,
      parentName: parent.name,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'open'
    };
    tickets.push(newTicket);
    writeJSONFile('tickets.json', tickets);
    res.status(201).json({ message: 'Ticket submitted successfully', ticket: newTicket });
  } catch (error) {
    console.error('Ticket submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all parent tickets (for volunteers)
router.get('/tickets', (req, res) => {
  try {
    const tickets = readJSONFile('tickets.json');
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Volunteer replies to a ticket (creates a new ticket message and closes the ticket)
router.post('/tickets/:ticketId/reply', (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const { reply, volunteerId } = req.body;
    if (!reply || !reply.trim() || !volunteerId) {
      return res.status(400).json({ error: 'Reply message and volunteerId are required' });
    }
    const tickets = readJSONFile('tickets.json');
    const ticket = tickets.find(t => t._id === ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Ticket is already closed' });
    }
    // Create a new ticket message for the reply
    const replyTicket = {
      _id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      parentId: ticket.parentId,
      volunteerId: volunteerId,
      parentName: ticket.parentName,
      message: reply.trim(),
      createdAt: new Date().toISOString(),
      status: 'closed',
      replyTo: ticket._id // reference to the original ticket
    };
    tickets.push(replyTicket);
    // Close the original ticket
    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    writeJSONFile('tickets.json', tickets);
    res.json({ message: 'Reply sent and ticket closed', ticket: replyTicket });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
