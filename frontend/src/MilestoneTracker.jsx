import React, { useState, useEffect } from 'react';
import './MilestoneTracker.css';

const MilestoneTracker = () => {
  const [milestones, setMilestones] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [formData, setFormData] = useState({
    mediaUrl: '',
    mediaType: 'image',
    mediaSize: '',
    mediaDuration: ''
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchMilestones();
    fetchChildren();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/milestones/milestones');
      const data = await response.json();
      setMilestones(data);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      // Fallback to mock data
      const mockMilestones = [
        { _id: '1', title: 'Crawling', description: 'Child starts to crawl on hands and knees.', ageGroup: '0-3' },
        { _id: '2', title: 'First Words', description: 'Child says their first recognizable words.', ageGroup: '0-3' },
        { _id: '3', title: 'Drawing Shapes', description: 'Child can draw basic shapes like circles and squares.', ageGroup: '4-6' },
        { _id: '4', title: 'Reading Simple Sentences', description: 'Child can read simple sentences independently.', ageGroup: '7-8' }
      ];
      setMilestones(mockMilestones);
    }
  };

  const fetchChildren = async () => {
    try {
      // For now, using mock parent ID = 1. In real app, get from authentication
      const response = await fetch('http://localhost:3000/api/milestones/children/1');
      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
      // Fallback to mock data
      const mockChildren = [
        { _id: '1', name: 'Aarav Sharma', ageGroup: '0-3' },
        { _id: '2', name: 'Isha Verma', ageGroup: '4-6' }
      ];
      setChildren(mockChildren);
    }
  };

  const handleUploadClick = (milestone) => {
    setSelectedMilestone(milestone);
    setShowUploadForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submissionData = {
      childId: selectedChild,
      milestoneId: selectedMilestone._id,
      mediaUrl: formData.mediaUrl,
      mediaType: formData.mediaType,
      mediaSize: parseFloat(formData.mediaSize),
      mediaDuration: formData.mediaType === 'video' ? parseFloat(formData.mediaDuration) : null,
      status: 'pending'
    };

    try {
      // API call to submit milestone status
      const response = await fetch('http://localhost:3000/api/milestones/milestone-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Milestone submitted successfully:', result);
        
        // Reset form
        setFormData({
          mediaUrl: '',
          mediaType: 'image',
          mediaSize: '',
          mediaDuration: ''
        });
        setShowUploadForm(false);
        setSelectedMilestone(null);
        
        alert('Milestone submitted successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit milestone');
      }
    } catch (error) {
      console.error('Error submitting milestone:', error);
      alert('Error submitting milestone. Please try again.');
    }
  };

  const filteredMilestones = selectedChild 
    ? milestones.filter(milestone => {
        const child = children.find(c => c._id === selectedChild);
        return child && milestone.ageGroup === child.ageGroup;
      })
    : [];

  return (
    <div className="milestone-tracker">
      <h1>Milestone Tracker</h1>
      
      {/* Child Selection */}
      <div className="child-selection">
        <label htmlFor="child-select">Select Child:</label>
        <select 
          id="child-select"
          value={selectedChild} 
          onChange={(e) => setSelectedChild(e.target.value)}
        >
          <option value="">Select a child</option>
          {children.map(child => (
            <option key={child._id} value={child._id}>
              {child.name} (Age Group: {child.ageGroup})
            </option>
          ))}
        </select>
      </div>

      {/* Milestone List */}
      {selectedChild && (
        <div className="milestone-list">
          <h2>Milestones for {children.find(c => c._id === selectedChild)?.name}</h2>
          {filteredMilestones.map(milestone => (
            <div key={milestone._id} className="milestone-item">
              <div className="milestone-content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
                <span className="age-group">Age Group: {milestone.ageGroup}</span>
              </div>
              <button 
                className="upload-btn"
                onClick={() => handleUploadClick(milestone)}
              >
                📷 Upload Media
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && selectedMilestone && (
        <div className="modal-overlay">
          <div className="upload-form">
            <h3>Upload Media for: {selectedMilestone.title}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="mediaUrl">Media URL (Image/Video Link):</label>
                <input
                  type="url"
                  id="mediaUrl"
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleFormChange}
                  placeholder="https://example.com/your-media-link"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mediaType">Media Type:</label>
                <select
                  id="mediaType"
                  name="mediaType"
                  value={formData.mediaType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mediaSize">Media Size (MB):</label>
                <input
                  type="number"
                  id="mediaSize"
                  name="mediaSize"
                  value={formData.mediaSize}
                  onChange={handleFormChange}
                  placeholder="e.g., 2.5"
                  step="0.1"
                  min="0"
                  required
                />
              </div>

              {formData.mediaType === 'video' && (
                <div className="form-group">
                  <label htmlFor="mediaDuration">Duration (seconds):</label>
                  <input
                    type="number"
                    id="mediaDuration"
                    name="mediaDuration"
                    value={formData.mediaDuration}
                    onChange={handleFormChange}
                    placeholder="e.g., 30"
                    min="0"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-btn">Submit</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedMilestone(null);
                    setFormData({
                      mediaUrl: '',
                      mediaType: 'image',
                      mediaSize: '',
                      mediaDuration: ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
