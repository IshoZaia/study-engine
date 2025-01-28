import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/authService';

const LoginPage = () => {
  const [userData, setUserData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) =>
    setUserData({ ...userData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(userData);
      const redirectPath = location.state?.from || '/courses'; // Use the original path or default to courses
      navigate(redirectPath); // Redirect after login
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
        <h3 className="text-2xl font-bold text-center">Login to your account</h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <label className="block">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="mt-4">
            <label className="block">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <span className="text-xs text-gray-600">Forgot password?</span>
            <a href="#" className="text-xs text-blue-600 hover:underline ml-1">
              Click here
            </a>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 focus:outline-none"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleRegisterRedirect}
              className="text-sm text-blue-600 hover:underline"
            >
              Don't have an account?
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
