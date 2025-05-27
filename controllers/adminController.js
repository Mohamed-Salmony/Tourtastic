const User = require("../models/User");
const Booking = require("../models/Booking");
const Destination = require("../models/Destination");
const NewsletterSubscription = require("../models/NewsletterSubscription");
const asyncHandler = require("../middleware/asyncHandler");
const sendEmail = require('../utils/sendEmail'); // Import the email utility
const path = require('path');
const fs = require('fs');

// --- Dashboard & Reports --- 

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const totalBookings = await Booking.countDocuments();
  const totalUsers = await User.countDocuments();
  // Add more stats as needed (e.g., revenue, new users this month)
  // Fetch real data or calculate based on models for production
  const stats = {
    totalBookings,
    totalUsers,
    // Example placeholder stats - replace with real calculations
    revenue: 214500, 
    newUsers: 384,
    avgBookingValue: 167
  };
  res.status(200).json({ success: true, data: stats });
});

// @desc    Get data for reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = asyncHandler(async (req, res, next) => {
  // Add logic to generate report data based on query params (date range, etc.)
  // Example placeholder data - replace with real calculations
  const reportData = {
    totalRevenue: 305000,
    totalBookings: 100,
    customerSatisfaction: 87,
    growthRate: 24,
    revenueByMonth: [/* ... */],
    bookingDistribution: { flights: 45, hotels: 30, tours: 15, carRentals: 10 },
    topDestinations: [/* ... */]
  };
  res.status(200).json({ success: true, data: reportData });
});

// @desc    Download report (e.g., CSV)
// @route   GET /api/admin/reports/download
// @access  Private/Admin
exports.downloadReport = asyncHandler(async (req, res, next) => {
  // Add logic to generate and send a report file (e.g., CSV)
  // Example: Generate CSV content
  const csvContent = "ID,Customer,Date,Amount\nBK-1001,John Doe,2023-05-15,1249.99\nBK-1002,Jane Smith,2023-06-22,799.50";
  const filePath = path.join(__dirname, '..', 'uploads', 'reports', 'report.csv');
  const reportDir = path.dirname(filePath);
  if (!fs.existsSync(reportDir)){
      fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(filePath, csvContent);

  res.download(filePath, 'tourtastic_report.csv', (err) => {
      if (err) {
          console.error("Error downloading report:", err);
          // Handle error, but don't try to send headers again if already sent
          if (!res.headersSent) {
              return next(new Error('Could not download the report.'));
          }
      } else {
          // Optionally delete the file after download
          // fs.unlinkSync(filePath);
      }
  });
});

// --- Booking Management --- 

// @desc    Get all bookings (Admin)
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = asyncHandler(async (req, res, next) => {
  // Add filtering, sorting, pagination later if needed
  const bookings = await Booking.find().populate('userId', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get single booking (Admin)
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
exports.getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('userId', 'name email');
  if (!booking) {
    return next(new Error(`Booking not found with id of ${req.params.id}`));
  }
  res.status(200).json({ success: true, data: booking });
});

// @desc    Update booking status or details (Admin) - Handles optional PDF upload
// @route   PUT /api/admin/bookings/:id
// @access  Private/Admin
exports.updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new Error(`Booking not found with id of ${req.params.id}`));
  }

  // Update fields (e.g., status, notes)
  const { status, notes } = req.body;
  const updateData = { ticketInfo: booking.ticketInfo || {} }; // Ensure ticketInfo exists

  if (status) updateData.status = status;
  if (notes) updateData.ticketInfo.notes = notes;
  
  // Handle file upload if present
  if (req.file) {
      // If there was a previous file, attempt to delete it
      if (updateData.ticketInfo.filePath) {
          const oldPath = path.join(__dirname, '..', updateData.ticketInfo.filePath); // Adjust path as needed
          fs.unlink(oldPath, (err) => {
              if (err) console.error("Error deleting old ticket file:", oldPath, err);
          });
      }
      // Store the relative path from the project root
      updateData.ticketInfo.filePath = req.file.path.replace(/^\.\//, ''); // Store relative path
  }
  
  updateData.updatedAt = Date.now();

  // Perform the update
  booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: booking });
});

// @desc    Delete booking (Admin)
// @route   DELETE /api/admin/bookings/:id
// @access  Private/Admin
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new Error(`Booking not found with id of ${req.params.id}`));
  }

  // Optionally delete associated ticket file
  if (booking.ticketInfo && booking.ticketInfo.filePath) {
      const filePath = path.join(__dirname, '..', booking.ticketInfo.filePath); // Adjust path
      fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting ticket file during booking deletion:", filePath, err);
      });
  }

  await booking.deleteOne(); // Use deleteOne or remove

  res.status(200).json({ success: true, data: {} });
});

// @desc    Trigger manual ticket sending (Admin)
// @route   POST /api/admin/bookings/:id/send-ticket
// @access  Private/Admin
exports.sendTicket = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('userId', 'name email');
  if (!booking) {
    return next(new Error(`Booking not found with id of ${req.params.id}`));
  }

  const recipientEmail = booking.customerEmail;
  if (!recipientEmail) {
       return res.status(400).json({ success: false, message: 'Booking customer email not found.' });
  }

  // Check if a ticket file path exists in the booking record
  const pdfFilePath = booking.ticketInfo && booking.ticketInfo.filePath 
                      ? path.join(__dirname, '..', booking.ticketInfo.filePath) // Construct absolute path
                      : null;

  if (!pdfFilePath || !fs.existsSync(pdfFilePath)) {
      console.error(`Ticket file not found for booking ${booking.bookingId} at path: ${pdfFilePath}`);
      return res.status(400).json({ success: false, message: 'Ticket PDF file not found for this booking. Please upload it first.' });
  }

  // Email content (can be customized via req.body if needed)
  const subject = `Your Tourtastic Ticket for Booking ${booking.bookingId}`;
  const body = `Dear ${booking.customerName},

Please find your travel ticket attached for booking ID: ${booking.bookingId}.

Destination: ${booking.destination || 'N/A'}
Booking Type: ${booking.type}
Date: ${booking.bookingDate.toDateString()}

Thank you for choosing Tourtastic!

Best regards,
The Tourtastic Team`;

  try {
    await sendEmail({
      to: recipientEmail,
      subject: subject,
      text: body,
      attachments: [{ 
          filename: `Tourtastic_Ticket_${booking.bookingId}.pdf`, // Custom filename for email
          path: pdfFilePath 
      }]
    });

    // Update booking status or ticketInfo if needed
    booking.ticketInfo.sentAt = Date.now();
    await booking.save();

    res.status(200).json({ success: true, message: `Ticket email sent successfully to ${recipientEmail}` });
  } catch (err) {
    console.error("Send Ticket Email Error:", err);
    // Use the error handler middleware
    return next(new Error("Email could not be sent. Check server logs and email configuration.")); 
  }
});


// --- User Management --- 

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  // Add filtering, sorting, pagination later
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Get single user (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new Error(`User not found with id of ${req.params.id}`));
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Create user (Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, status } = req.body;
  const user = await User.create({ name, email, password, role, status });
  // Don't send password back
  const userResponse = { ...user._doc };
  delete userResponse.password;
  res.status(201).json({ success: true, data: userResponse });
});

// @desc    Update user details (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Exclude password from direct update here; handle separately if needed
  const { name, email, role, status } = req.body;
  const updateData = { name, email, role, status };

  // Remove undefined fields to avoid overwriting with null
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new Error(`User not found with id of ${req.params.id}`));
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new Error(`User not found with id of ${req.params.id}`));
  }
  // Add logic here if deleting a user should also delete their bookings or other related data
  // Example: await Booking.deleteMany({ userId: req.params.id });
  await user.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// --- Destination Management --- 

// @desc    Create destination (Admin) - Handles optional image upload
// @route   POST /api/admin/destinations
// @access  Private/Admin
exports.createDestination = asyncHandler(async (req, res, next) => {
  const createData = { ...req.body };
  if (req.file) {
      createData.imageUrl = req.file.path.replace(/^\.\//, ''); // Store relative path
  }
  const destination = await Destination.create(createData);
  res.status(201).json({ success: true, data: destination });
});

// @desc    Update destination (Admin) - Handles optional image upload
// @route   PUT /api/admin/destinations/:id
// @access  Private/Admin
exports.updateDestination = asyncHandler(async (req, res, next) => {
  let destination = await Destination.findById(req.params.id);
  if (!destination) {
    return next(new Error(`Destination not found with id of ${req.params.id}`));
  }

  const updateData = { ...req.body };
  updateData.updatedAt = Date.now(); // Manually update updatedAt

  if (req.file) {
      // Delete old image if it exists
      if (destination.imageUrl) {
          const oldPath = path.join(__dirname, '..', destination.imageUrl);
          fs.unlink(oldPath, (err) => {
              if (err) console.error("Error deleting old destination image:", oldPath, err);
          });
      }
      updateData.imageUrl = req.file.path.replace(/^\.\//, ''); // Store new relative path
  }

  destination = await Destination.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: destination });
});

// @desc    Delete destination (Admin)
// @route   DELETE /api/admin/destinations/:id
// @access  Private/Admin
exports.deleteDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    return next(new Error(`Destination not found with id of ${req.params.id}`));
  }
  // Delete associated image file
  if (destination.imageUrl) {
      const imagePath = path.join(__dirname, '..', destination.imageUrl);
      fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting destination image during deletion:", imagePath, err);
      });
  }
  await destination.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// --- Newsletter Management --- 

// @desc    Get all newsletter subscribers (Admin)
// @route   GET /api/admin/newsletter/subscribers
// @access  Private/Admin
exports.getSubscribers = asyncHandler(async (req, res, next) => {
  const subscribers = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
  res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
});

// @desc    Send newsletter email (Admin)
// @route   POST /api/admin/newsletter/send
// @access  Private/Admin
exports.sendNewsletter = asyncHandler(async (req, res, next) => {
  const { subject, body } = req.body;
  if (!subject || !body) {
    return res.status(400).json({ success: false, message: "Subject and body are required" });
  }

  const subscribers = await NewsletterSubscription.find();
  const emails = subscribers.map(sub => sub.email);

  if (emails.length === 0) {
      return res.status(200).json({ success: true, message: "No subscribers to send newsletter to." });
  }

  try {
    // Use BCC for privacy
    await sendEmail({ 
        to: process.env.EMAIL_USER, // Send to self or a dummy address
        bcc: emails.join(','), 
        subject,
        text: body 
    }); 
    
    res.status(200).json({ success: true, message: `Newsletter sent successfully to ${emails.length} subscribers (via BCC).` });
  } catch (err) {
    console.error("Send Newsletter Error:", err);
    return next(new Error("Newsletter could not be sent. Check server logs and email configuration."));
  }
});

// --- Admin Profile Management --- (Example - can be expanded)

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
exports.getAdminProfile = asyncHandler(async (req, res, next) => {
  // req.user is set by protect middleware
  res.status(200).json({ success: true, data: req.user });
});

// @desc    Update current admin profile (e.g., password)
// @route   PUT /api/admin/profile
// @access  Private/Admin
exports.updateAdminProfile = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    // Fetch user with password field selected for saving
    const user = await User.findById(req.user.id).select('+password'); 

    if (!user) {
        // This case should ideally not happen if protect middleware is working
        return next(new Error('Admin user not found'));
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
        // If password is being updated, it will be hashed by the pre-save hook
        user.password = password;
    }

    // Save the updated user. Pre-save hook will hash password if changed.
    await user.save();

    // Don't send password back in the response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(200).json({ success: true, data: userResponse });
});

// --- Flight Booking Management ---

// @desc    Get all flight bookings (Admin)
// @route   GET /api/admin/flight-bookings
// @access  Private/Admin
exports.getAllFlightBookings = asyncHandler(async (req, res, next) => {
  const { status, search } = req.query;
  
  let query = {};
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  // Search by booking ID, customer name, or email
  if (search) {
    query.$or = [
      { bookingId: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerEmail: { $regex: search, $options: 'i' } }
    ];
  }

  const bookings = await FlightBooking.find(query)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get single flight booking (Admin)
// @route   GET /api/admin/flight-bookings/:bookingId
// @access  Private/Admin
exports.getFlightBookingById = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ bookingId: req.params.bookingId });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Update flight booking (Admin)
// @route   PUT /api/admin/flight-bookings/:bookingId
// @access  Private/Admin
exports.updateFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ bookingId: req.params.bookingId });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  const {
    status,
    adminData,
    ticketDetails,
    paymentDetails
  } = req.body;

  // Update admin data if provided
  if (adminData) {
    booking.adminData = {
      ...booking.adminData,
      ...adminData
    };
  }

  // Update ticket details if provided
  if (ticketDetails) {
    booking.ticketDetails = {
      ...booking.ticketDetails,
      ...ticketDetails
    };
  }

  // Update payment details if provided
  if (paymentDetails) {
    booking.paymentDetails = {
      ...booking.paymentDetails,
      ...paymentDetails
    };
  }

  // Update status and add to timeline if status changed
  if (status && status !== booking.status) {
    booking.status = status;
    booking.timeline.push({
      status,
      date: new Date(),
      notes: req.body.notes || `Status updated to ${status}`,
      updatedBy: req.user.name
    });
  }

  booking.updatedAt = Date.now();
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Upload ticket document
// @route   POST /api/admin/flight-bookings/:bookingId/upload-ticket
// @access  Private/Admin
exports.uploadFlightTicket = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ bookingId: req.params.bookingId });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a ticket file"
    });
  }

  // Store the ticket file path
  booking.ticketDetails.eTicketPath = req.file.path.replace(/^\.\//, '');
  
  // Add to additional documents if specified
  if (req.body.addToDocuments) {
    booking.ticketDetails.additionalDocuments.push({
      name: req.file.originalname,
      path: req.file.path.replace(/^\.\//, ''),
      uploadedAt: new Date()
    });
  }

  // Update timeline
  booking.timeline.push({
    status: booking.status,
    date: new Date(),
    notes: "E-ticket uploaded",
    updatedBy: req.user.name
  });

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Send ticket to customer
// @route   POST /api/admin/flight-bookings/:bookingId/send-ticket
// @access  Private/Admin
exports.sendFlightTicket = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ bookingId: req.params.bookingId });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  if (!booking.ticketDetails.eTicketPath) {
    return res.status(400).json({
      success: false,
      message: "No e-ticket found for this booking"
    });
  }

  const emailContent = `Dear ${booking.customerName},

Your flight ticket for booking ${booking.bookingId} is attached.

Flight Details:
From: ${booking.flightDetails.from}
To: ${booking.flightDetails.to}
Date: ${new Date(booking.flightDetails.departureDate).toLocaleDateString()}
${booking.flightDetails.returnDate ? `Return: ${new Date(booking.flightDetails.returnDate).toLocaleDateString()}` : ''}

If you have any questions, please contact us.

Best regards,
Tourtastic Team`;

  try {
    await sendEmail({
      to: booking.customerEmail,
      subject: `Your Flight Ticket - Booking ${booking.bookingId}`,
      text: emailContent,
      attachments: [{
        filename: `ticket_${booking.bookingId}.pdf`,
        path: path.join(__dirname, '..', booking.ticketDetails.eTicketPath)
      }]
    });

    // Update timeline
    booking.timeline.push({
      status: booking.status,
      date: new Date(),
      notes: "Ticket sent to customer",
      updatedBy: req.user.name
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Ticket sent successfully",
      data: booking
    });
  } catch (error) {
    console.error("Send Flight Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send ticket email"
    });
  }
});
