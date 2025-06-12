const Destination = require('../models/Destination');
const asyncHandler = require('../middleware/async');

// @desc    Get all destinations
// @route   GET /api/destinations
// @access  Public
exports.getDestinations = asyncHandler(async (req, res, next) => {
  const destinations = await Destination.find();
  
  res.status(200).json({
    success: true,
    count: destinations.length,
    data: destinations
  });
});

// @desc    Get single destination
// @route   GET /api/destinations/:id
// @access  Public
exports.getDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);
  
  if (!destination) {
    return res.status(404).json({
      success: false,
      error: 'Destination not found'
    });
  }

  res.status(200).json({
    success: true,
    data: destination
  });
});

// @desc    Create new destination
// @route   POST /api/destinations
// @access  Private/Admin
exports.createDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.create(req.body);

  res.status(201).json({
    success: true,
    data: destination
  });
});

// @desc    Update destination
// @route   PUT /api/destinations/:id
// @access  Private/Admin
exports.updateDestination = asyncHandler(async (req, res, next) => {
  let destination = await Destination.findById(req.params.id);

  if (!destination) {
    return res.status(404).json({
      success: false,
      error: 'Destination not found'
    });
  }

  destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: destination
  });
});

// @desc    Delete destination
// @route   DELETE /api/destinations/:id
// @access  Private/Admin
exports.deleteDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);

  if (!destination) {
    return res.status(404).json({
      success: false,
      error: 'Destination not found'
    });
  }

  await destination.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 