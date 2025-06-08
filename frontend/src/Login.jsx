import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bg from './assets/loginimg.jpeg';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'parent') navigate('/parent-dashboard');
        else if (data.user.role === 'volunteer') navigate('/volunteer-dashboard');
      } else setError(data.error || 'Login failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-90 opacity-30 blur-sm"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Form container */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Track your child's developmental milestones
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg border border-pink-100" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
                placeholder="Enter your username"
              />
              <label
                htmlFor="username"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
              >
                Username
              </label>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
                placeholder="Enter your password"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
              >
                Password
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-700">
              Don’t have an account?{' '}
              <Link to="/register" className="font-medium text-pink-600 hover:text-pink-500">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-pink-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
            <div className="text-xs text-gray-700 space-y-1">
              <p><strong>Parent:</strong> rajesh_kumar / parent123</p>
              <p><strong>Volunteer:</strong> sneha_volunteer / volunteer123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
