const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Generate access token (short-lived)
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // 1 hour
  });

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 days
  });

  return { accessToken, refreshToken };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
  });

  if (user) {
    // Create welcome notification
    await Notification.create({
      userId: user._id,
      title: "Welcome to Tourtastic!",
      message: `Welcome ${name}! We're excited to have you join our travel community. Start exploring amazing destinations and create unforgettable memories.`,
      type: "welcome"
    });

    // Don't send password back, even hashed
    const userResponse = { ...user._doc };
    delete userResponse.password;

    const tokens = generateToken(user._id);

    res.status(201).json({
      success: true,
      ...tokens,
      user: userResponse,
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid user data" });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide an email and password" 
    });
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Don't send password back
    const userResponse = { ...user._doc };
    delete userResponse.password;

    // Generate tokens
    const tokens = generateToken(user._id);

    res.status(200).json({
      success: true,
      ...tokens,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required"
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Generate new tokens
    const tokens = generateToken(decoded.id);

    res.status(200).json({
      success: true,
      ...tokens
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
