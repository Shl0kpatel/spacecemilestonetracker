import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const goToDashboard = () => {
    if (user?.role === 'parent') {
      navigate('/parent-dashboard');
    } else if (user?.role === 'volunteer') {
      navigate('/volunteer-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">👶</div>
              <h1 className="text-2xl font-bold text-gray-900">MilestoneTracker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user.name}</span>
                  <button
                    onClick={goToDashboard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🌟</div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Track Your Child's
            <span className="text-indigo-600 block">Developmental Journey</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A comprehensive platform for parents and volunteers to monitor, submit, and review 
            children's developmental milestones with evidence-based tracking.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Start Tracking Milestones
              </Link>
              <Link
                to="/milestonesstatus"
                className="bg-white hover:bg-gray-50 text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium border-2 border-indigo-600 shadow-lg hover:shadow-xl transition-all"
              >
                View Demo
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">For Parents</h3>
            <p className="text-gray-600">
              Submit milestone achievements with photo/video evidence. Track your child's progress 
              across different developmental areas and age groups.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Age-Based Tracking</h3>
            <p className="text-gray-600">
              Organized milestones by age groups (0-3, 4-6, 7-8 years) with category-based 
              filtering for motor skills, language, cognitive development.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Review</h3>
            <p className="text-gray-600">
              Qualified volunteers review submissions and provide feedback. Receive SMS 
              notifications for important updates and rejected submissions.
            </p>
          </div>
        </div>

        
      </main>
    </div>
  );
};

export default Home;
