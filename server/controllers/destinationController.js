const Destination = require("../models/Destination");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Get all destinations
// @route   GET /api/destinations
// @route   GET /api/destinations?featured=true
// @access  Public
exports.getDestinations = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from filtering (like pagination, sorting - add later if needed)
  const removeFields = ["select", "sort", "page", "limit", "featured"];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc) - Add if needed for other filters
  // queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Base query
  query = Destination.find(JSON.parse(queryStr));

  // Filter by featured if requested
  if (req.query.featured) {
    query = query.where("featured").equals(req.query.featured === "true");
  }

  // Select Fields - Add if needed
  // if (req.query.select) {
  //   const fields = req.query.select.split(",").join(" ");
  //   query = query.select(fields);
  // }

  // Sort - Add if needed
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(",").join(" ");
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort("-createdAt"); // Default sort
  // }

  // Pagination - Add if needed
  // const page = parseInt(req.query.page, 10) || 1;
  // const limit = parseInt(req.query.limit, 10) || 25;
  // const startIndex = (page - 1) * limit;
  // const endIndex = page * limit;
  // const total = await Destination.countDocuments(JSON.parse(queryStr)); // Adjust count based on filters
  // query = query.skip(startIndex).limit(limit);

  // Executing query
  const destinations = await query;

  // Pagination result - Add if needed
  // const pagination = {};
  // if (endIndex < total) {
  //   pagination.next = { page: page + 1, limit };
  // }
  // if (startIndex > 0) {
  //   pagination.prev = { page: page - 1, limit };
  // }

  res.status(200).json({
    success: true,
    count: destinations.length,
    // pagination, // Add if needed
    data: destinations,
  });
});

// @desc    Get single destination
// @route   GET /api/destinations/:id
// @access  Public
exports.getDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);

  if (!destination) {
    // This will be caught by the errorHandler and formatted
    return next(new Error(`Destination not found with id of ${req.params.id}`)); 
  }

  res.status(200).json({ success: true, data: destination });
});

// Note: Create, Update, Delete destinations will be handled in adminController
