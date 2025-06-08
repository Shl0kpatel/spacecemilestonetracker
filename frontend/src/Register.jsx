import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    username: '',
    password: '',
    role: 'parent'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
     <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join us to track developmental milestones
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg border border-pink-100" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
              />
              <label
                htmlFor="name"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5
                peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
              >
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                id="contact"
                name="contact"
                type="tel"
                required
                value={formData.contact}
                onChange={handleChange}
                placeholder="Contact Number"
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
              />
              <label
                htmlFor="contact"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5
                peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
              >
                Contact Number
              </label>
            </div>

            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
              />
              <label
                htmlFor="username"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5
                peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
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
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-black focus:outline-none focus:border-pink-500"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all
                peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5
                peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-pink-600"
              >
                Password
              </label>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              >
                <option value="parent">Parent</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Parents can track milestones. Volunteers can review them.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-pink-600 hover:text-pink-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Register;
