const asyncHandler = require("../middleware/async");
const Contact = require("../models/Contact");

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public
exports.createContactMessage = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  const contact = await Contact.create({
    name,
    email,
    subject,
    message
  });

  // Send notification email to admin (you can implement this later)
  // await sendEmail({
  //   to: process.env.ADMIN_EMAIL,
  //   subject: `New Contact Message: ${subject}`,
  //   text: `From: ${name} (${email})\n\nMessage:\n${message}`
  // });

  res.status(201).json({
    success: true,
    data: contact
  });
});

// @desc    Get all contact messages
// @route   GET /api/admin/contact
// @access  Private/Admin
exports.getAllContactMessages = asyncHandler(async (req, res, next) => {
  const contacts = await Contact.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

// @desc    Update contact message status
// @route   PUT /api/admin/contact/:id
// @access  Private/Admin
exports.updateContactStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  );

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact message not found'
    });
  }

  res.status(200).json({
    success: true,
    data: contact
  });
});
