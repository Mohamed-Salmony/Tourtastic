const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  } 
  // Optional: Set token from cookie if you implement cookie-based auth later
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized to access this route (no token)" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized to access this route (user not found)" });
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ success: false, message: "Not authorized to access this route (token failed)" });
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        // Should be caught by protect middleware first, but added for safety
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
