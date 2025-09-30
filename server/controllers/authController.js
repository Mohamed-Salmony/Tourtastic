const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const { sendMail } = require('../utils/email');

// @desc    Check if email or username exists
// @route   POST /api/auth/check-exists
// @access  Public
exports.checkExists = asyncHandler(async (req, res) => {
  const { email, username } = req.body;
  
  if (!email && !username) {
    return res.status(400).json({
      success: false,
      message: "Please provide either email or username to check"
    });
  }

  let result = { exists: false };

  // Check both email and username if provided
  if (email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      result = {
        exists: true,
        field: 'email',
        message: 'Email already registered'
      };
    }
  }

  if (username && !result.exists) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      result = {
        exists: true,
        field: 'username',
        message: 'Username already taken'
      };
    }
  }

  return res.status(result.exists ? 400 : 200).json(result);
});

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Generate access token (short-lived)
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '2h', 
  });

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', 
  });

  return { accessToken, refreshToken };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, phoneNumber, dateOfBirth, role } = req.body;

  // Check if user already exists (by email or username)
  const userExists = await User.findOne({ 
    $or: [
      { email },
      { username }
    ]
  });

  if (userExists) {
    return res.status(400).json({ 
      success: false, 
      message: userExists.email === email ? "Email already registered" : "Username already taken" 
    });
  }

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password,
    phone: phoneNumber,
    birthdate: dateOfBirth,
    role: role || "user",
  });

  if (user) {
    // Create welcome notification
    await Notification.create({
      userId: user._id,
      title: {
        en: "Welcome to Tourtastic!",
        ar: "مرحبًا بكم في تورتاستيك!"
      },
      message: {
        en: `Welcome ${name}! We're excited to have you join our travel community. Start exploring amazing destinations and create unforgettable memories.`,
        ar: `مرحبًا بك ${name}! نحن متحمسون لانضمامك إلى مجتمع السفر الخاص بنا. ابدأ في استكشاف وجهات مذهلة وصنع ذكريات لا تُنسى.`
      },
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
  const { email, username, password } = req.body;

  // Validate credential & password
  if ((!email && !username) || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide an email/username and password" 
    });
  }

  try {
    // Check for user by email or username
    const query = email ? { email } : { username };
    const user = await User.findOne(query).select("+password");

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

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token is required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Refresh token verification failed:", err);
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
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

// @desc    Logout user (invalidate token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // If using JWT only (stateless), just return success
  // Client should remove token from localStorage/sessionStorage
  
  // If using refresh tokens stored in DB, invalidate them here:
  if (req.user && req.user.id) {
    try {
      // Update user to invalidate refresh token (if you have this field)
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { refreshToken: 1 }
      });
    } catch (err) {
      console.error('Error clearing refresh token:', err);
    }
  }

  // Clear session if using express-session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
  }

  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.clearCookie('connect.sid'); // express-session cookie

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Helper to generate a 6-digit numeric code
function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// @desc    Request password reset code (OTP) via email
// @route   POST /api/auth/password/forgot
// @access  Public
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  // Always respond with success to avoid email enumeration
  let user = await User.findOne({ email }).select('+resetPasswordCodeHash');
  if (user) {
    const code = generateNumericCode(6);
    const saltRounds = 10;
    const hash = await bcrypt.hash(code, saltRounds);
    user.resetPasswordCodeHash = hash;
    user.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordVerified = false;
    await user.save();

    // Send email via SMTP
    const subject = 'Tourtastic Password Reset Code';
    const text = `Your Tourtastic password reset code is: ${code}. This code will expire in 10 minutes.`;
    const html = `<p>Hello${user.name ? ' ' + user.name : ''},</p>
      <p>Your Tourtastic password reset code is:</p>
      <h2 style="letter-spacing:3px;">${code}</h2>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>`;

    try {
      await sendMail({ to: email, subject, text, html });
    } catch (err) {
      console.error('Error sending password reset email:', err.message);
      // Do not expose email errors to client for security; still respond success
    }
  }

  return res.status(200).json({ success: true, message: 'If the email exists, a reset code has been sent.' });
});

// @desc    Verify password reset code (OTP)
// @route   POST /api/auth/password/verify
// @access  Public
exports.verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code are required' });
  }

  const user = await User.findOne({ email }).select('+resetPasswordCodeHash');
  if (!user || !user.resetPasswordCodeHash || !user.resetPasswordCodeExpires) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }
  if (user.resetPasswordCodeExpires.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Code has expired' });
  }

  const match = await bcrypt.compare(String(code), user.resetPasswordCodeHash);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }

  user.resetPasswordVerified = true;
  await user.save();
  return res.status(200).json({ success: true, message: 'Code verified' });
});

// @desc    Reset password using verified code
// @route   POST /api/auth/password/reset
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, code, and newPassword are required' });
  }

  const user = await User.findOne({ email }).select('+resetPasswordCodeHash +password');
  if (!user || !user.resetPasswordCodeHash || !user.resetPasswordCodeExpires) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }
  if (user.resetPasswordCodeExpires.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Code has expired' });
  }

  const match = await bcrypt.compare(String(code), user.resetPasswordCodeHash);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }

  // Set new password and clear reset fields
  user.password = newPassword;
  user.resetPasswordCodeHash = undefined;
  user.resetPasswordCodeExpires = undefined;
  user.resetPasswordVerified = false;
  await user.save();

  return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
});
