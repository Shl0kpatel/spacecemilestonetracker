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

    console.log('Before creating submission data:');
    console.log('Selected child:', selectedChild);
    console.log('Selected milestone:', selectedMilestone);
    console.log('Media URL:', mediaUrl);

    const submissionData = {
      childId: selectedChild?.id,
      milestoneId: selectedMilestone?.id,
      mediaUrl: mediaUrl.trim() || null
    };
    
    console.log('Submitting milestone data:', submissionData);
    console.log('JSON stringified:', JSON.stringify(submissionData));

    try {
      const response = await fetch('http://localhost:3000/api/parents/milestone/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh dashboard data
        await fetchDashboardData(user.id);
        setShowSubmissionForm(false);
        setSelectedMilestone(null);
        setMediaUrl('');
        alert('Milestone submitted successfully!');
      } else {
        console.error('Submission failed:', data);
        alert(data.error || 'Failed to submit milestone');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('submitMilestoneFor', { title: selectedMilestone.title })}
            </h3>
            <form onSubmit={handleSubmitMilestone}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediaUrlOptional')}
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={t('mediaUrlPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('provideMediaLink')}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmissionForm(false);
                    setSelectedMilestone(null);
                    setMediaUrl('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {submitting ? t('submitting') : t('submit')}
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
