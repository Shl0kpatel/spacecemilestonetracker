import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
              <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{t('welcome', { name: user.name })}</span>
                  <button
                    onClick={goToDashboard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {t('goToDashboard')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {t('getStarted')}
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
            {t('trackTitle')}
            <span className="text-indigo-600 block">{t('trackSubtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('trackDesc')}
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {t('startTracking')}
              </Link>
              <Link
                to="/milestonesstatus"
                className="bg-white hover:bg-gray-50 text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium border-2 border-indigo-600 shadow-lg hover:shadow-xl transition-all"
              >
                {t('viewDemo')}
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('forParentsTitle')}</h3>
            <p className="text-gray-600">
              {t('forParentsDesc')}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('ageTrackingTitle')}</h3>
            <p className="text-gray-600">
              {t('ageTrackingDesc')}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('expertReviewTitle')}</h3>
            <p className="text-gray-600">
              {t('expertReviewDesc')}
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('seeInAction')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('exploreDemo')}
          </p>
          <Link
            to="/milestonesstatus"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
          >
            {t('viewDemoMilestones')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;
