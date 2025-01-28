import React, { useState } from 'react';
import { register } from '../services/authService';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateUsername = (username) => username.length >= 3;
  const validatePassword = (password) =>
    password.length >= 8 && /\d/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = formData;

    if (!validateUsername(username) || !validatePassword(password)) {
      alert('Invalid username or password');
      return;
    }

    try {
      await register(formData);
      alert('Registration successful');
      window.location.href = '/';
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div
        className="px-10 py-6 mt-4 text-left bg-white shadow-lg"
        style={{ maxWidth: '600px' }}
      >
        <h3 className="text-2xl font-bold text-center">Create Account</h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <label className="block" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="mt-4">
            <label className="block" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="mt-4">
            <label className="block" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <p className="mt-2 text-xs text-gray-500">
              Password must be at least 8 characters long and contain a number.
            </p>
          </div>
          <div className="flex flex-col items-center justify-between mt-6">
            <button
              type="submit"
              className="w-full px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            >
              Register
            </button>
            <a
              href="/login"
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Already have an account? Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
