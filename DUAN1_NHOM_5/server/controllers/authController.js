const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Simulated user database (replace with database in production)
const users = [];

const authController = {
  // Register
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      // Check if user exists
      const userExists = users.find(u => u.email === email);
      if (userExists) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword,
        createdAt: new Date()
      };

      users.push(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  },

  // Logout
  logout: (req, res) => {
    try {
      // In production, you might want to blacklist the token or clear it from database
      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed', error: error.message });
    }
  },

  // Refresh Token
  refreshToken: (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
      );

      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Token refreshed',
        accessToken: newAccessToken
      });
    } catch (error) {
      res.status(401).json({ message: 'Invalid refresh token', error: error.message });
    }
  },

  // Get Profile
  getProfile: (req, res) => {
    try {
      const user = users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get profile', error: error.message });
    }
  }
};

module.exports = authController;
