import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track login status
  const navigate = useNavigate(); // For navigation

  // Check if user is logged in by verifying if the token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Set to true if token exists
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear token
    localStorage.removeItem('userId'); // Clear userId
    setIsAuthenticated(false); // Update state
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          to={isAuthenticated ? "/courses" : "/"} 
          className="text-white text-lg font-bold"
        >
          Home
        </Link>

        <div className="flex space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleLogout}
                className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white">
                Login
              </Link>
              <Link to="/register" className="text-white">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
