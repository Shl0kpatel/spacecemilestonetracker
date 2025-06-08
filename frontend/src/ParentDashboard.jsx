import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const ParentDashboard = () => {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'success', 'error'
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const audioRef = useRef(null);

  useEffect(() => {
    // Play audio guide on mount
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    const audio = new window.Audio(`/guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [i18n.language]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'parent') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData(parsedUser.id);
  }, [navigate]);

  const fetchDashboardData = async (parentId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/parents/dashboard/${parentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setChildren(data.children);
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadStatus('');
    setUploadProgress(0);

    console.log('Before creating submission data:');
    console.log('Selected child:', selectedChild);
    console.log('Selected milestone:', selectedMilestone);
    console.log('Selected file:', selectedFile);
    console.log('Media URL:', mediaUrl);

    try {
      let response, data;

      if (selectedFile) {
        // File upload submission
        setUploadStatus('uploading');
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('childId', selectedChild?.id);
        formData.append('milestoneId', selectedMilestone?.id);

        console.log('Submitting with file upload:', {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        });

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener('load', async () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadStatus('success');
                await fetchDashboardData(user.id);
                setShowSubmissionForm(false);
                setSelectedMilestone(null);
                setMediaUrl('');
                setSelectedFile(null);
                setUploadProgress(0);
                setUploadStatus('');
                alert('Milestone submitted successfully with file upload!');
              } else {
                setUploadStatus('error');
                console.error('Upload failed:', result);
                alert(result.error || 'Failed to upload file');
              }
            } catch (error) {
              setUploadStatus('error');
              console.error('Response parsing error:', error);
              alert('Upload failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          });

          xhr.addEventListener('error', () => {
            setUploadStatus('error');
            setSubmitting(false);
            alert('Network error during upload. Please try again.');
          });

          xhr.open('POST', 'http://localhost:3000/api/parents/milestone/submit-with-file');
          xhr.send(formData);
        });

      } else {
        // URL submission (legacy)
        const submissionData = {
          childId: selectedChild?.id,
          milestoneId: selectedMilestone?.id,
          mediaUrl: mediaUrl.trim() || null
        };
        
        console.log('Submitting with URL:', submissionData);

        response = await fetch('http://localhost:3000/api/parents/milestone/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        data = await response.json();

        if (response.ok) {
          await fetchDashboardData(user.id);
          setShowSubmissionForm(false);
          setSelectedMilestone(null);
          setMediaUrl('');
          setSelectedFile(null);
          setUploadProgress(0);
          setUploadStatus('');
          alert('Milestone submitted successfully!');
        } else {
          console.error('Submission failed:', data);
          alert(data.error || 'Failed to submit milestone');
        }
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Submission error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image (JPEG, PNG, GIF) or video (MP4, AVI, MOV) file.');
        return;
      }

      // Validate file size (5MB for images, 50MB for videos)
      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type.startsWith('image/') ? '5MB' : '50MB';
        alert(`File size must be less than ${maxSizeMB}.`);
        return;
      }

      setSelectedFile(file);
      setMediaUrl(''); // Clear URL when file is selected
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Completed';
      case 'rejected': return 'Needs Review';
      case 'pending': return 'Under Review';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('parentDashboardTitle')}</h1>
              <p className="text-gray-600">{t('welcomeBack', { name: user?.name })}</p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🧶</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noChildrenFound')}</h3>
            <p className="text-gray-600">{t('contactAdminToAddChildren')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{child.name}</h2>
                      <p className="text-gray-600">
                        {t('age')}: {child.age} • {t('ageGroup')}: {child.ageGroup}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {child.progress.completed}/{child.progress.total}
                      </div>
                      <p className="text-sm text-gray-600">{t('milestonesCompleted')}</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('progress')}</span>
                      <span>{Math.round((child.progress.completed / child.progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(child.progress.completed / child.progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">{child.progress.completed}</div>
                      <div className="text-xs text-gray-600">{t('completed')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">{child.progress.pending}</div>
                      <div className="text-xs text-gray-600">{t('underReview')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">{child.progress.rejected}</div>
                      <div className="text-xs text-gray-600">{t('needsReview')}</div>
                    </div>
                  </div>
                </div>
                {/* Milestones */}
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('recentMilestones')}</h3>
                  <div className="grid gap-4">
                    {child.milestones.slice(0, 6).map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {milestone.category}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {t('age')} {milestone.ageGroup}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                            {t(getStatusText(milestone.status))}
                          </span>
                          {milestone.status === 'not_started' && (
                            <button
                              onClick={() => {
                                setSelectedChild(child);
                                setSelectedMilestone(milestone);
                                setShowSubmissionForm(true);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              {t('submit')}
                            </button>
                          )}
                          {milestone.mediaUrl && (
                            <a
                              href={milestone.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 text-xs"
                            >
                              {t('viewMedia')}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setSelectedChild(child)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      {t('viewAllMilestones', { count: child.milestones.length })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Submission Form Modal */}
      {showSubmissionForm && selectedMilestone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('submitMilestoneFor', { title: selectedMilestone.title })}
            </h3>
            <form onSubmit={handleSubmitMilestone}>
              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Photo or Video
                </label>
                
                {/* Drag and Drop Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : selectedFile 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="text-green-600">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-xs text-gray-500">
                        Images: PNG, JPG, GIF up to 5MB<br />
                        Videos: MP4, AVI, MOV up to 50MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* URL Input (Legacy) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediaUrlOptional')}
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedFile(null); // Clear file when URL is entered
                    }
                  }}
                  placeholder="https://example.com/photo-or-video.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!!selectedFile}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('provideMediaLink')}
                </p>
              </div>

              {/* Upload Progress */}
              {(uploadProgress > 0 || uploadStatus) && (
                <div className="mb-4">
                  {uploadStatus === 'uploading' && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center text-green-600 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Upload completed successfully!
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center text-red-600 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Upload failed. Please try again.
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmissionForm(false);
                    setSelectedMilestone(null);
                    setMediaUrl('');
                    setSelectedFile(null);
                    setUploadProgress(0);
                    setUploadStatus('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadStatus === 'uploading' || (!selectedFile && !mediaUrl.trim())}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {submitting || uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
