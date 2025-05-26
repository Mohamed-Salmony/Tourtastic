const NewsletterSubscription = require("../models/NewsletterSubscription");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribeNewsletter = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide an email" });
  }

  // Check if email is already subscribed
  const existingSubscription = await NewsletterSubscription.findOne({ email });

  if (existingSubscription) {
    // Decide on behavior: return success or indicate already subscribed
    // Returning success to avoid disclosing subscription status
    return res.status(200).json({ success: true, message: "Subscription successful (or already subscribed)" });
  }

  // Create subscription
  const subscription = await NewsletterSubscription.create({ email });

  res.status(201).json({
    success: true,
    message: "Successfully subscribed to the newsletter",
    data: { email: subscription.email, subscribedAt: subscription.subscribedAt }, // Avoid sending full objectId
  });
});

// Note: Admin functions (list subscribers, send newsletter) will be in adminController
