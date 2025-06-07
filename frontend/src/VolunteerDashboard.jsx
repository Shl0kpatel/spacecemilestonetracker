import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VolunteerDashboard = () => {
  const [user, setUser] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'volunteer') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData();
    fetchTickets();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/volunteers/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setPendingSubmissions(data.pendingSubmissions);
        setStatistics(data.stats); // Fixed: backend returns 'stats' not 'statistics'
      } else {
        console.error('Failed to fetch dashboard data:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubmissions = async (status = 'all') => {
    try {
      const response = await fetch(`http://localhost:3000/api/volunteers/submissions?status=${status}`);
      const data = await response.json();
      
      if (response.ok) {
        setAllSubmissions(data);
      } else {
        console.error('Failed to fetch submissions:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/parents/tickets');
      const data = await response.json();
      if (response.ok) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3000/api/volunteers/submission/${selectedSubmission._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: feedback.trim() || null,
          volunteerId: user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh data
        await fetchDashboardData();
        if (filter !== 'pending') {
          await fetchAllSubmissions(filter);
        }
        
        setShowReviewModal(false);
        setSelectedSubmission(null);
        setReviewStatus('');
        setFeedback('');
        alert(`Submission ${reviewStatus} successfully!`);
      } else {
        alert(data.error || 'Failed to review submission');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    if (newFilter !== 'pending') {
      await fetchAllSubmissions(newFilter);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentSubmissions = filter === 'pending' ? pendingSubmissions : allSubmissions;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tickets from Parents */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Parent Tickets</h2>
          </div>
          {ticketsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map(ticket => (
                <div key={ticket._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{ticket.parentName}</div>
                      <div className="text-sm text-gray-600">{ticket.message}</div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 text-yellow-600">⏳</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalPending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 text-green-600">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalAccepted || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-6 h-6 text-red-600">❌</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalRejected || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 text-blue-600">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalSubmissions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'pending', label: 'Pending Review', count: statistics.totalPending },
                { key: 'accepted', label: 'Accepted', count: statistics.totalAccepted },
                { key: 'rejected', label: 'Rejected', count: statistics.totalRejected },
                { key: 'all', label: 'All Submissions', count: statistics.totalSubmissions }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label} ({tab.count || 0})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {filter === 'pending' ? 'Pending Submissions' : 
               filter === 'all' ? 'All Submissions' : 
               `${filter.charAt(0).toUpperCase() + filter.slice(1)} Submissions`}
            </h2>
          </div>

          {currentSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600">
                {filter === 'pending' ? 'No submissions waiting for review.' : `No ${filter} submissions.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentSubmissions.map((submission) => (
                <div key={submission._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {submission.milestoneTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Child:</strong> {submission.childName} (Age {submission.childAge})</p>
                          <p><strong>Parent:</strong> {submission.parentName}</p>
                        </div>
                        <div>
                          <p><strong>Category:</strong> {submission.milestoneCategory}</p>
                          <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-700">{submission.milestoneDescription}</p>
                      
                      {submission.feedback && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <strong>Feedback:</strong> {submission.feedback}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-3">
                      {submission.mediaUrl && (
                        <a
                          href={submission.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          View Media
                        </a>
                      )}
                      
                      {submission.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowReviewModal(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Review Submission: {selectedSubmission.milestoneTitle}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p><strong>Child:</strong> {selectedSubmission.childName} (Age {selectedSubmission.childAge})</p>
              <p><strong>Parent:</strong> {selectedSubmission.parentName}</p>
              <p className="mt-2"><strong>Milestone:</strong> {selectedSubmission.milestoneDescription}</p>
              {selectedSubmission.mediaUrl && (
                <p className="mt-2">
                  <strong>Media:</strong> 
                  <a 
                    href={selectedSubmission.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 ml-2"
                  >
                    View Submitted Media
                  </a>
                </p>
              )}
            </div>
            
            <form onSubmit={handleReviewSubmission}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select decision...</option>
                  <option value="accepted">Accept</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback {reviewStatus === 'rejected' && <span className="text-red-500">(Required for rejection)</span>}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required={reviewStatus === 'rejected'}
                  rows={3}
                  placeholder={reviewStatus === 'accepted' ? 'Great job! (optional)' : 'Please provide feedback...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedSubmission(null);
                    setReviewStatus('');
                    setFeedback('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reviewStatus}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
