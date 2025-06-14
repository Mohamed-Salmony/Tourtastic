const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body; // Role might be restricted later

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
    role: role || "user", // Default to user if not provided or restrict based on logic
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

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
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
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

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

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
