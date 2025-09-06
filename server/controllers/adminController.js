const User = require("../models/User");
const Booking = require("../models/Booking");
const FlightBooking = require("../models/FlightBooking");
const Destination = require("../models/Destination");
const NewsletterSubscription = require("../models/NewsletterSubscription");
const SearchLog = require('../models/SearchLog');
const asyncHandler = require("../middleware/asyncHandler");
const sendEmail = require('../utils/sendEmail'); // Import the email utility
const path = require('path');
const fs = require('fs');
// Google Cloud Storage
let Storage;
try {
  Storage = require('@google-cloud/storage').Storage;
} catch (e) {
  // optional - if package not installed, server will log at runtime
  Storage = null;
}

// Helper: map FlightBooking document to a client-friendly shape
const mapFlightBookingForClient = (b) => {
  if (!b) return b;
  const paymentAmount = b.paymentDetails && (b.paymentDetails.amount || (b.paymentDetails.transactions && b.paymentDetails.transactions.reduce((s, t) => s + (t.amount || 0), 0)));
  const adminCost = b.adminData && b.adminData.cost && b.adminData.cost.amount;
  const selectedFlightPrice = b.flightDetails && b.flightDetails.selectedFlight && b.flightDetails.selectedFlight.price && b.flightDetails.selectedFlight.price.total;
  const amount = paymentAmount ?? adminCost ?? selectedFlightPrice ?? null;
  // Normalize flightDetails/selectedFlight and expose airport codes where possible
  const flightDet = b.flightDetails || {};
  const sel = (flightDet && flightDet.selectedFlight) || {};
  const rawSel = (sel && sel.raw) || {};

  const departureAirportCode = flightDet.fromAirportCode || sel.departureAirportCode || sel.departureAirport || rawSel.departureAirportCode || rawSel.departure_airport_code || (rawSel.departure_airport && rawSel.departure_airport.code) || undefined;
  const arrivalAirportCode = flightDet.toAirportCode || sel.arrivalAirportCode || sel.arrivalAirport || rawSel.arrivalAirportCode || rawSel.arrival_airport_code || (rawSel.arrival_airport && rawSel.arrival_airport.code) || undefined;

  const normalizedFlightDetails = Object.assign({}, flightDet, {
    fromAirportCode: flightDet.fromAirportCode || departureAirportCode,
    toAirportCode: flightDet.toAirportCode || arrivalAirportCode,
    selectedFlight: Object.assign({}, sel, {
      departureAirportCode: sel.departureAirportCode || departureAirportCode,
      arrivalAirportCode: sel.arrivalAirportCode || arrivalAirportCode,
      // keep raw for debugging
      raw: sel.raw || rawSel
    })
  });

  return {
    _id: b._id,
    id: b.bookingId || (b._id ? String(b._id) : undefined),
    bookingId: b.bookingId,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    // Frontend expects a destination field - derive from flightDetails.to
    destination: flightDet && flightDet.to ? flightDet.to : (b.adminData && b.adminData.bookingReference) || '',
    // Keep a simple type label for legacy UI
    type: 'Flight',
    // bookingDate / date: use departureDate if present otherwise createdAt
    bookingDate: flightDet && flightDet.departureDate ? flightDet.departureDate : b.createdAt,
    date: flightDet && flightDet.departureDate ? flightDet.departureDate : b.createdAt,
    // expose structured details for view UI (use normalized flight details)
    details: {
      flightDetails: normalizedFlightDetails,
      passengerDetails: (flightDet && flightDet.passengerDetails) || [],
      selectedFlight: normalizedFlightDetails.selectedFlight || {},
    },
    amount,
    status: b.status,
    ticketInfo: b.ticketDetails || {},
    ticketDetails: b.ticketDetails || {},
    paymentDetails: b.paymentDetails || {},
    adminData: b.adminData || {},
    timeline: b.timeline || [],
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    // keep raw document in case UI needs more
    _raw: b
  };
};

// --- Dashboard & Reports --- 

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const totalBookings = await Booking.countDocuments();
  const totalUsers = await User.countDocuments();

  // Calculate revenue from bookings collection (Booking.amount)
  const revenueAgg = await Booking.aggregate([
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } }
  ]);
  const revenue = (revenueAgg[0] && revenueAgg[0].total) || 0;

  // Basic averages
  const avgBookingValue = totalBookings > 0 ? Math.round(revenue / totalBookings) : 0;

  const stats = {
    totalBookings,
    totalUsers,
    revenue,
    avgBookingValue
  };
  res.status(200).json({ success: true, data: stats });
});

// @desc    Get data for reports
// @route   GET /api/admin/reports
// @access  Private/Admin
// Helper: compute monthly revenue for a given year
const computeRevenueByMonth = async (year) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const agg = await Booking.aggregate([
    { $match: { bookingDate: { $gte: start, $lt: end } } },
    { $group: { _id: { $month: "$bookingDate" }, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    { $sort: { _id: 1 } }
  ]);
  // Build array for 12 months
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
  agg.forEach(a => { months[a._id - 1].total = a.total; });
  return months.map(m => m.total);
};

// @desc Get data for reports
// Query params: year (number) - defaults to current year
exports.getReports = asyncHandler(async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const lastYear = year - 1;

  // total revenue and bookings
  const revenueThisYearAgg = await Booking.aggregate([
    { $match: { bookingDate: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } }, count: { $sum: 1 } } }
  ]);
  const revenueLastYearAgg = await Booking.aggregate([
    { $match: { bookingDate: { $gte: new Date(lastYear, 0, 1), $lt: new Date(lastYear + 1, 0, 1) } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } }, count: { $sum: 1 } } }
  ]);

  const totalRevenue = (revenueThisYearAgg[0] && revenueThisYearAgg[0].total) || 0;
  const totalBookings = (revenueThisYearAgg[0] && revenueThisYearAgg[0].count) || 0;
  const lastRevenue = (revenueLastYearAgg[0] && revenueLastYearAgg[0].total) || 0;
  const lastBookings = (revenueLastYearAgg[0] && revenueLastYearAgg[0].count) || 0;

  const growthRateRevenue = lastRevenue > 0 ? Math.round(((totalRevenue - lastRevenue) / lastRevenue) * 100) : 0;
  const growthRateBookings = lastBookings > 0 ? Math.round(((totalBookings - lastBookings) / lastBookings) * 100) : 0;

  // revenue by month
  const revenueByMonth = await computeRevenueByMonth(year);

  // booking distribution by destination
  const distAgg = await Booking.aggregate([
    { $group: { _id: "$destination", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 }
  ]);
  const totalDist = distAgg.reduce((s, d) => s + d.count, 0) || 1;
  const bookingDistribution = distAgg.map(d => ({ name: d._id || 'Unknown', value: d.count, percent: Math.round((d.count / totalDist) * 100) }));

  // top destinations (compare with last year's counts)
  const topDestinations = await Promise.all(distAgg.slice(0, 10).map(async (d) => {
    const city = d._id || 'Unknown';
    const thisCount = d.count;
    const lastAgg = await Booking.aggregate([
      { $match: { destination: city, bookingDate: { $gte: new Date(lastYear, 0, 1), $lt: new Date(lastYear + 1, 0, 1) } } },
      { $group: { _id: "$destination", count: { $sum: 1 } } }
    ]);
    const lastCount = (lastAgg[0] && lastAgg[0].count) || 0;
    const growth = lastCount > 0 ? Math.round(((thisCount - lastCount) / lastCount) * 100) : 0;
    return { destination: city, bookings: thisCount, growthPercent: growth };
  }));

  // search logs (recent 50)
  const searchLogs = await SearchLog.find().sort({ searchedAt: -1 }).limit(50).lean();

  res.status(200).json({ success: true, data: {
    totalRevenue,
    totalBookings,
    customerSatisfaction: 87, // placeholder
    growthRate: { revenue: growthRateRevenue, bookings: growthRateBookings },
    revenueByMonth,
    bookingDistribution,
    topDestinations,
    searchLogs
  } });
});

// @desc    Download report (e.g., CSV)
// @route   GET /api/admin/reports/download
// @access  Private/Admin
exports.downloadReport = asyncHandler(async (req, res, next) => {
  // Export bookings/orders to XLSX
  const bookings = await Booking.find().populate('userId', 'name email').lean();

  // Build workbook using exceljs if available, otherwise fallback to CSV
  let ExcelJS;
  try { ExcelJS = require('exceljs'); } catch (e) { ExcelJS = null; }
  const rows = bookings.map(b => ({
    bookingId: b.bookingId || b._id,
    user: (b.userId && (b.userId.name || b.userId.email)) || '',
    from: (b.details && b.details.flightDetails && b.details.flightDetails.from) || '',
    to: (b.details && b.details.flightDetails && b.details.flightDetails.to) || b.destination || '',
    bookingDate: b.bookingDate ? new Date(b.bookingDate).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : ''),
    amount: b.amount || 0,
    status: b.status || ''
  }));

  if (ExcelJS) {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Orders');

      // Define columns
      const cols = Object.keys(rows[0] || {}).map(k => ({ header: k, key: k }));
      sheet.columns = cols;

      // Add rows
      rows.forEach(r => sheet.addRow(r));

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', 'attachment; filename="tourtastic_orders.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('exceljs export failed, falling back to CSV', err);
      // continue to CSV fallback
    }
  }

  // Fallback to CSV
  const header = Object.keys(rows[0] || {}).join(',') + '\n';
  const csv = rows.map(r => Object.values(r).map(v => `"${String(v || '')}"`).join(',')).join('\n');
  const csvContent = header + csv;
  res.setHeader('Content-Disposition', 'attachment; filename="tourtastic_orders.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csvContent);
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
  // parse JSON encoded multipart fields
  const parseIfJson = (val) => {
    if (!val) return val;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch (err) { return val; }
  };

  const data = { ...req.body };
  data.name = parseIfJson(req.body.name || req.body['name']);
  data.country = parseIfJson(req.body.country || req.body['country']);
  data.description = parseIfJson(req.body.description || req.body['description']);
  data.bestTimeToVisit = parseIfJson(req.body.bestTimeToVisit || req.body['bestTimeToVisit']);
  data.topAttractions = parseIfJson(req.body.topAttractions || req.body['topAttractions']);
  data.localCuisine = parseIfJson(req.body.localCuisine || req.body['localCuisine']);
  data.shopping = parseIfJson(req.body.shopping || req.body['shopping']);

  // find uploaded file in req.files (upload.any) or req.file
  const findFile = () => {
    if (req.file) return req.file;
    if (Array.isArray(req.files) && req.files.length > 0) {
      const found = req.files.find(f => f.fieldname === 'destinationImage' || f.fieldname === 'image');
      return found || req.files[0];
    }
    return null;
  };

  const uploaded = findFile();
  if (uploaded && uploaded.path && !uploaded.buffer) {
    // saved to disk by multer.diskStorage -> upload local file to Google Cloud Storage
    try {
      const { uploadFile } = require('../utils/gcsStorage');
      const ext = require('path').extname(uploaded.path) || '.jpg';
      const destPath = `destinations/${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
      const publicUrl = await uploadFile(uploaded.path, destPath, uploaded.mimetype || 'image/jpeg');
      data.image = publicUrl;
    } catch (err) {
      console.error('GCS upload (admin.createDestination local file) failed:', err);
      return res.status(500).json({ success: false, error: 'Image upload failed', details: String(err) });
    }
  }

  // If buffer exists (unlikely with diskStorage) handle buffer upload
  if (uploaded && uploaded.buffer) {
    try {
      const destPath = `destinations/${Date.now()}-${Math.round(Math.random()*1e9)}.jpg`;
      const { uploadBuffer } = require('../utils/gcsStorage');
      const publicUrl = await uploadBuffer(uploaded.buffer, destPath, uploaded.mimetype || 'image/jpeg');
      data.image = publicUrl;
    } catch (err) {
      console.error('GCS upload (admin.createDestination buffer) failed:', err);
      return res.status(500).json({ success: false, error: 'Image upload failed', details: String(err) });
    }
  }

  // normalize localized fields (simple coercion)
  const ensureLocalized = (val) => {
    if (!val) return { en: '', ar: '' };
    if (typeof val === 'string') return { en: val, ar: val };
    if (typeof val === 'object') return { en: val.en || '', ar: val.ar || '' };
    return { en: '', ar: '' };
  };

  // normalize list fields into { en: string[], ar: string[] }
  const normalizeListField = (val) => {
    if (!val) return { en: [], ar: [] };
    // If it's a JSON string that represents arrays/objects it will already have been parsed
    if (Array.isArray(val)) return { en: val, ar: val };
    if (typeof val === 'object') {
      const enArr = Array.isArray(val.en) ? val.en : (Array.isArray(val) ? val : []);
      const arArr = Array.isArray(val.ar) ? val.ar : (enArr.length ? enArr : []);
      return { en: enArr, ar: arArr };
    }
    // Fallback: single string -> put into en only
    return { en: [String(val)], ar: [String(val)] };
  };

  data.name = ensureLocalized(data.name);
  data.country = ensureLocalized(data.country);
  data.description = ensureLocalized(data.description);
  // Normalize list fields to {en: [], ar: []}
  data.topAttractions = normalizeListField(data.topAttractions);
  data.localCuisine = normalizeListField(data.localCuisine);
  data.shopping = normalizeListField(data.shopping);
  // quickInfo handling
  const qTime = req.body['quickInfo[timeZone]'] || req.body['quickInfo.timeZone'] || req.body.timeZone || req.body.time_zone;
  const qAirport = req.body['quickInfo[airport]'] || req.body['quickInfo.airport'] || req.body.airport || req.body.airport_code;
  data.quickInfo = data.quickInfo || {};
  if (qTime) data.quickInfo.timeZone = qTime;
  if (qAirport) {
    // Store airport as a single code/string value
    data.quickInfo.airport = (typeof qAirport === 'string') ? qAirport : (qAirport && qAirport.code) ? String(qAirport.code) : String(qAirport);
  }

  // Ensure bestTimeToVisit is localized object {en, ar}
  if (!data.bestTimeToVisit) {
    data.bestTimeToVisit = { en: '', ar: '' };
  } else if (typeof data.bestTimeToVisit === 'string') {
    data.bestTimeToVisit = { en: data.bestTimeToVisit, ar: data.bestTimeToVisit };
  } else if (typeof data.bestTimeToVisit === 'object') {
    data.bestTimeToVisit = {
      en: data.bestTimeToVisit.en || '',
      ar: data.bestTimeToVisit.ar || data.bestTimeToVisit.en || ''
    };
  }

  // Ensure quickInfo exists and airport is a simple string code
  if (!data.quickInfo) data.quickInfo = { timeZone: '', airport: '' };
  if (data.quickInfo && data.quickInfo.airport) {
    if (typeof data.quickInfo.airport !== 'string') {
      // attempt to extract a string code
      const ap = data.quickInfo.airport;
      data.quickInfo.airport = ap && ap.code ? String(ap.code) : String(ap);
    }
    data.quickInfo.airport = String(data.quickInfo.airport);
  } else {
    data.quickInfo.airport = '';
  }

  // Debug log
  console.log('admin.createDestination req.body keys:', Object.keys(req.body));
  console.log('admin.createDestination found uploaded file:', !!uploaded, uploaded ? uploaded.fieldname : null);
  // Ensure quickInfo is parsed if sent as JSON string and normalize airport to string
  if (typeof data.quickInfo === 'string') {
    try { data.quickInfo = JSON.parse(data.quickInfo); } catch (err) { /* leave as string if not parseable */ }
  }
  data.quickInfo = data.quickInfo || {};
  if (data.quickInfo && data.quickInfo.airport) {
    const ap = data.quickInfo.airport;
    if (typeof ap === 'string') {
      data.quickInfo.airport = ap;
    } else if (typeof ap === 'object' && ap !== null) {
      data.quickInfo.airport = ap.code ;
    } else {
      data.quickInfo.airport = String(ap || '');
    }
  } else {
    data.quickInfo.airport = data.quickInfo.airport || '';
  }

  console.log('admin.createDestination normalized data preview:', { name: data.name, country: data.country, imageUrl: !!data.imageUrl || !!data.image, quickInfo: data.quickInfo });

  // validate
  const missing = [];
  if (!data.image && !data.imageUrl) missing.push('image');
  if (!data.name || !data.name.en) missing.push('name.en');
  if (!data.country || !data.country.en) missing.push('country.en');
  if (missing.length > 0) return res.status(400).json({ success: false, error: 'Missing required fields', missing });

  const destination = await Destination.create(data);
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

  const bookings = await FlightBooking.find(query).sort({ createdAt: -1 });
  const mapped = bookings.map(mapFlightBookingForClient);

  res.status(200).json({
    success: true,
    count: mapped.length,
    data: mapped
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
    data: mapFlightBookingForClient(booking)
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
  data: mapFlightBookingForClient(booking)
  });
});

// @desc    Delete a flight booking (Admin)
// @route   DELETE /api/admin/flight-bookings/:bookingId
// @access  Private/Admin
exports.deleteFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ bookingId: req.params.bookingId });

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Flight booking not found' });
  }

  // Optionally delete uploaded ticket file
  if (booking.ticketDetails && booking.ticketDetails.eTicketPath) {
    const filePath = path.join(__dirname, '..', booking.ticketDetails.eTicketPath);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting eTicket file during flight booking deletion:', filePath, err);
    });
  }

  await booking.deleteOne();

  res.status(200).json({ success: true, data: {} });
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

  // If Google Cloud Storage is configured, upload file there and use public URL
  let publicUrl = null;
  if (req.file) {
    const localPath = req.file.path;
    const originalName = req.file.originalname || path.basename(localPath);
    // Allow either GCLOUD_BUCKET or GCP_BUCKET_NAME (the repo .env uses GCP_BUCKET_NAME)
    const bucketName = process.env.GCLOUD_BUCKET || process.env.GCP_BUCKET_NAME || process.env.GCP_BUCKET;
    if (Storage && bucketName) {
      try {
        const storage = new Storage();
  const bucket = storage.bucket(bucketName);
        const dest = `tickets/${booking.bookingId}/${Date.now()}_${originalName}`;
        // Upload local file to GCS
        await bucket.upload(localPath, { destination: dest, metadata: { contentType: req.file.mimetype || 'application/pdf' } });
        // make public (optional - required if you want direct https URL)
        try { await bucket.file(dest).makePublic(); } catch (e) { /* ignore */ }
        publicUrl = `https://storage.googleapis.com/${bucketName}/${dest}`;
      } catch (err) {
        console.error('GCS upload failed, falling back to local storage', err);
        publicUrl = null;
      }
    }

    // Fallback to local path if GCS not available
    if (!publicUrl) {
      publicUrl = req.file.path.replace(/^\.\//, '');
    }

    // Store the ticket file path (URL or local path)
    booking.ticketDetails = booking.ticketDetails || {};
    booking.ticketDetails.eTicketPath = publicUrl;

    // Add to additional documents if specified
    if (req.body.addToDocuments) {
      booking.ticketDetails.additionalDocuments = booking.ticketDetails.additionalDocuments || [];
      booking.ticketDetails.additionalDocuments.push({
        name: originalName,
        path: publicUrl,
        uploadedAt: new Date()
      });
    }

    // remove local temp file if it exists and we uploaded to GCS
    if (publicUrl && Storage && process.env.GCLOUD_BUCKET) {
      fs.unlink(localPath, (err) => { if (err) console.warn('Failed to remove local upload:', err); });
    }
  }

  // Save any ticket info fields from form (ticketNumber, pnr) and admin note
  booking.ticketDetails = booking.ticketDetails || {};
  if (req.body.ticketNumber) booking.ticketDetails.ticketNumber = String(req.body.ticketNumber);
  if (req.body.pnr) booking.ticketDetails.pnr = String(req.body.pnr);
  // store admin note under adminData.notes
  booking.adminData = booking.adminData || {};
  if (req.body.adminNote) booking.adminData.notes = String(req.body.adminNote);

  // Mark booking as Done
  booking.status = 'done';

  // Update timeline
  booking.timeline = booking.timeline || [];
  booking.timeline.push({
    status: booking.status,
    date: new Date(),
    notes: "E-ticket uploaded and booking completed",
    updatedBy: req.user ? req.user.name : 'system'
  });

  await booking.save();

  res.status(200).json({
    success: true,
    data: mapFlightBookingForClient(booking)
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
  data: mapFlightBookingForClient(booking)
    });
  } catch (error) {
    console.error("Send Flight Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send ticket email"
    });
  }
});
