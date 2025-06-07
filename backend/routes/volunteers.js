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

// Simulate SMS notification
const sendSMSNotification = (contact, message) => {
  console.log(`SMS to ${contact}: ${message}`);
  // In a real app, this would integrate with an SMS service
  return true;
};

// Get volunteer dashboard - pending submissions
router.get('/dashboard', (req, res) => {
  try {
    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const milestones = readJSONFile('milestones.json');
    const children = readJSONFile('children.json');
    const users = readJSONFile('users.json');

    // Get all submissions grouped by status
    const pendingSubmissions = milestoneStatus.filter(ms => ms.status === 'pending');
    const recentlyReviewed = milestoneStatus
      .filter(ms => ms.status !== 'pending' && ms.reviewedAt)
      .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
      .slice(0, 10);

    // Add details to submissions
    const enrichSubmissions = (submissions) => {
      return submissions.map(submission => {
        const milestone = milestones.find(m => m._id === submission.milestoneId);
        const child = children.find(c => c._id === submission.childId);
        const parent = users.find(u => u.id === child?.parentId);

        return {
          ...submission,
          milestoneTitle: milestone?.title || 'Unknown Milestone',
          milestoneDescription: milestone?.description || '',
          childName: child?.name || 'Unknown Child',
          childAge: child?.age || 0,
          parentName: parent?.name || 'Unknown Parent',
          parentContact: parent?.contact || ''
        };
      });
    };

    const enrichedPending = enrichSubmissions(pendingSubmissions);
    const enrichedRecent = enrichSubmissions(recentlyReviewed);

    // Statistics
    const stats = {
      totalPending: pendingSubmissions.length,
      totalAccepted: milestoneStatus.filter(ms => ms.status === 'accepted').length,
      totalRejected: milestoneStatus.filter(ms => ms.status === 'rejected').length,
      totalSubmissions: milestoneStatus.length
    };

    res.json({
      stats,
      pendingSubmissions: enrichedPending,
      recentlyReviewed: enrichedRecent
    });
  } catch (error) {
    console.error('Volunteer dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submissions by status
router.get('/submissions', (req, res) => {
  try {
    const status = req.query.status; // pending, accepted, rejected, all
    const ageGroup = req.query.ageGroup; // 0-3, 4-6, 7-8, all
    
    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const milestones = readJSONFile('milestones.json');
    const children = readJSONFile('children.json');
    const users = readJSONFile('users.json');

    let filteredSubmissions = milestoneStatus;

    // Filter by status
    if (status && status !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(ms => ms.status === status);
    }

    // Filter by age group
    if (ageGroup && ageGroup !== 'all') {
      const childrenInAgeGroup = children.filter(c => c.ageGroup === ageGroup);
      const childIdsInAgeGroup = childrenInAgeGroup.map(c => c._id);
      filteredSubmissions = filteredSubmissions.filter(ms => childIdsInAgeGroup.includes(ms.childId));
    }

    // Sort by submission date (newest first)
    filteredSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Enrich with details
    const enrichedSubmissions = filteredSubmissions.map(submission => {
      const milestone = milestones.find(m => m._id === submission.milestoneId);
      const child = children.find(c => c._id === submission.childId);
      const parent = users.find(u => u.id === child?.parentId);

      return {
        ...submission,
        milestoneTitle: milestone?.title || 'Unknown Milestone',
        milestoneDescription: milestone?.description || '',
        milestoneAgeGroup: milestone?.ageGroup || '',
        childName: child?.name || 'Unknown Child',
        childAge: child?.age || 0,
        childAgeGroup: child?.ageGroup || '',
        parentName: parent?.name || 'Unknown Parent',
        parentContact: parent?.contact || ''
      };
    });

    res.json(enrichedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific submission details
router.get('/submission/:submissionId', (req, res) => {
  try {
    const submissionId = req.params.submissionId; // Keep as string since _id is string
    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const milestones = readJSONFile('milestones.json');
    const children = readJSONFile('children.json');
    const users = readJSONFile('users.json');

    const submission = milestoneStatus.find(ms => ms._id === submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const milestone = milestones.find(m => m._id === submission.milestoneId);
    const child = children.find(c => c._id === submission.childId);
    const parent = users.find(u => u.id === child?.parentId);

    const enrichedSubmission = {
      ...submission,
      milestoneTitle: milestone?.title || 'Unknown Milestone',
      milestoneDescription: milestone?.description || '',
      milestoneAgeGroup: milestone?.ageGroup || '',
      childName: child?.name || 'Unknown Child',
      childAge: child?.age || 0,
      childAgeGroup: child?.ageGroup || '',
      parentName: parent?.name || 'Unknown Parent',
      parentContact: parent?.contact || ''
    };

    res.json(enrichedSubmission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review submission (accept/reject)
router.post('/review/:submissionId', (req, res) => {
  try {
    const submissionId = req.params.submissionId; // Keep as string since _id is string
    const { action, feedback, reviewerId } = req.body; // action: 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "accept" or "reject"' });
    }

    if (!reviewerId) {
      return res.status(400).json({ error: 'Reviewer ID is required' });
    }

    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const children = readJSONFile('children.json');
    const users = readJSONFile('users.json');

    const submissionIndex = milestoneStatus.findIndex(ms => ms._id === submissionId);
    if (submissionIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = milestoneStatus[submissionIndex];
    
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    // Update submission status
    milestoneStatus[submissionIndex] = {
      ...submission,
      status: action === 'accept' ? 'accepted' : 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: parseInt(reviewerId),
      feedback: feedback || null
    };

    writeJSONFile('milestoneStatus.json', milestoneStatus);

    // Send SMS notification if rejected
    if (action === 'reject') {
      const child = children.find(c => c._id === submission.childId);
      const parent = users.find(u => u.id === child?.parentId);
      
      if (parent && parent.contact) {
        const message = `Milestone submission for ${child.name} has been rejected. ${feedback ? 'Feedback: ' + feedback : 'Please review and resubmit.'}`;
        sendSMSNotification(parent.contact, message);
      }
    }

    res.json({
      message: `Submission ${action}ed successfully`,
      submission: milestoneStatus[submissionIndex]
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review submission endpoint (frontend compatible route)
router.post('/submission/:submissionId/review', (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const { status, feedback, volunteerId } = req.body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    if (!volunteerId) {
      return res.status(400).json({ error: 'Volunteer ID is required' });
    }

    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const children = readJSONFile('children.json');
    const users = readJSONFile('users.json');

    const submissionIndex = milestoneStatus.findIndex(ms => ms._id === submissionId);
    if (submissionIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = milestoneStatus[submissionIndex];
    
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    // Update submission status
    milestoneStatus[submissionIndex] = {
      ...submission,
      status: status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: parseInt(volunteerId),
      feedback: feedback || null
    };

    writeJSONFile('milestoneStatus.json', milestoneStatus);

    // Send SMS notification if rejected
    if (status === 'rejected') {
      const child = children.find(c => c._id === submission.childId);
      const parent = users.find(u => u.id === child?.parentId);
      
      if (parent && parent.contact) {
        const message = `Milestone submission for ${child.name} has been rejected. ${feedback ? 'Feedback: ' + feedback : 'Please review and resubmit.'}`;
        sendSMSNotification(parent.contact, message);
      }
    }

    res.json({
      message: `Submission ${status} successfully`,
      submission: milestoneStatus[submissionIndex]
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics for volunteer dashboard
router.get('/statistics', (req, res) => {
  try {
    const milestoneStatus = readJSONFile('milestoneStatus.json');
    const children = readJSONFile('children.json');

    // Overall statistics
    const totalSubmissions = milestoneStatus.length;
    const pendingSubmissions = milestoneStatus.filter(ms => ms.status === 'pending').length;
    const acceptedSubmissions = milestoneStatus.filter(ms => ms.status === 'accepted').length;
    const rejectedSubmissions = milestoneStatus.filter(ms => ms.status === 'rejected').length;

    // Age group breakdown
    const ageGroupStats = ['0-3', '4-6', '7-8'].map(ageGroup => {
      const childrenInGroup = children.filter(c => c.ageGroup === ageGroup);
      const childIds = childrenInGroup.map(c => c._id);
      const submissionsInGroup = milestoneStatus.filter(ms => childIds.includes(ms.childId));
      
      return {
        ageGroup,
        totalChildren: childrenInGroup.length,
        totalSubmissions: submissionsInGroup.length,
        pending: submissionsInGroup.filter(ms => ms.status === 'pending').length,
        accepted: submissionsInGroup.filter(ms => ms.status === 'accepted').length,
        rejected: submissionsInGroup.filter(ms => ms.status === 'rejected').length
      };
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSubmissions = milestoneStatus.filter(ms => 
      new Date(ms.submittedAt) >= sevenDaysAgo
    ).length;

    const recentReviews = milestoneStatus.filter(ms => 
      ms.reviewedAt && new Date(ms.reviewedAt) >= sevenDaysAgo
    ).length;

    res.json({
      overall: {
        totalSubmissions,
        pendingSubmissions,
        acceptedSubmissions,
        rejectedSubmissions,
        acceptanceRate: totalSubmissions > 0 ? ((acceptedSubmissions / (acceptedSubmissions + rejectedSubmissions)) * 100).toFixed(1) : 0
      },
      ageGroups: ageGroupStats,
      recentActivity: {
        newSubmissions: recentSubmissions,
        reviewsCompleted: recentReviews
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
