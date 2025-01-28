const jwt = require('jsonwebtoken');

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.warn('No authorization header provided.');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token after 'Bearer'
    if (!token) {
      console.warn('Invalid token format.');
      return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user from token:', decoded); // Log user info

    req.user = decoded; // Attach user data to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
