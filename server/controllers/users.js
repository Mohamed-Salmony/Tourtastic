const User = require('../models/User');
const asyncHandler = require('../middleware/async');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    birthdate: req.body.birthdate
  };

  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/:id/wishlist
// @access  Private
exports.getUserWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get all destinations
  const Destination = require('../models/Destination');
  const destinations = await Destination.find({
    _id: { $in: user.wishlist }
  });

  res.status(200).json({
    success: true,
    data: destinations
  });
});

// @desc    Add destination to wishlist
// @route   POST /api/users/:id/wishlist
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res, next) => {

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if destination is already in wishlist
  if (user.wishlist.includes(req.body.destinationId)) {
    return res.status(400).json({
      success: false,
      error: 'This destination is already in your wishlist'
    });
  }

  try {
    // Add the destination ID using findOneAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { wishlist: req.body.destinationId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wishlist'
    });
  }
});

// @desc    Remove destination from wishlist
// @route   DELETE /api/users/:id/wishlist/:itemId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Remove destination from wishlist using findOneAndUpdate
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.params.id },
    { $pull: { wishlist: req.params.itemId } },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedUser.wishlist
  });
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id; // From auth middleware

  // Find user with password field
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Verify current password using model method
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword; // The pre-save hook will hash it
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});