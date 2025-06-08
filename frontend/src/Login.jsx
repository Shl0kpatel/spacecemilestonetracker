import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const audioRef = useRef(null);
  const usernameAudioRef = useRef(null);
  const passwordAudioRef = useRef(null);

  const handlePlayAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Create a new Audio instance and play
    const audio = new window.Audio(process.env.BASE_URL ? process.env.BASE_URL + `/login_guide_${lang}.mp3` : `/login_guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play().catch((e) => {
      // Optionally handle play errors (e.g., user gesture required)
      // alert('Unable to play audio. Please check your browser settings.');
    });
  };

  const playUsernameAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    if (usernameAudioRef.current) {
      usernameAudioRef.current.pause();
      usernameAudioRef.current.currentTime = 0;
    }
    const audio = new window.Audio(`/username_guide_${lang}.mp3`);
    usernameAudioRef.current = audio;
    audio.play();
  };

  const playPasswordAudio = () => {
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    if (passwordAudioRef.current) {
      passwordAudioRef.current.pause();
      passwordAudioRef.current.currentTime = 0;
    }
    const audio = new window.Audio(`/password_guide_${lang}.mp3`);
    passwordAudioRef.current = audio;
    audio.play();
  };

  useEffect(() => {
    // Play audio guide for login form
    const lang = i18n.language === 'hi' ? 'hi' : 'en';
    const audio = new window.Audio(`/login_guide_${lang}.mp3`);
    audioRef.current = audio;
    audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Navigate based on role
        if (data.user.role === 'parent') {
          navigate('/parent-dashboard');
        } else if (data.user.role === 'volunteer') {
          navigate('/volunteer-dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center items-center space-x-2">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('loginTitle')}
          </h2>
          <button
            type="button"
            aria-label={t('playAudioGuide')}
            onClick={handlePlayAudio}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 28 }}
          >
            <span role="img" aria-label="audio">🔊</span>
          </button>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {t('username')}
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={t('playUsernameAudioGuide')}
                  onClick={playUsernameAudio}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 22 }}
                >
                  <span role="img" aria-label="audio">🔊</span>
                </button>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  onFocus={playUsernameAudio}
                  className="mt-1 appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ml-2"
                  placeholder={t('usernamePlaceholder')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={t('playPasswordAudioGuide')}
                  onClick={playPasswordAudio}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 22 }}
                >
                  <span role="img" aria-label="audio">🔊</span>
                </button>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  onFocus={playPasswordAudio}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ml-2"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('noAccount')}{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                {t('registerHere')}
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('demoAccounts')}</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>{t('parent')}:</strong> rajesh_kumar / parent123</p>
              <p><strong>{t('volunteer')}:</strong> sneha_volunteer / volunteer123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
