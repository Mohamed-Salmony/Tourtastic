const asyncHandler = require("../middleware/asyncHandler");
const FlightBooking = require("../models/FlightBooking");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

// @desc    Handle ECash payment callback
// @route   POST /api/payment/callback
// @access  Public
exports.handlePaymentCallback = asyncHandler(async (req, res) => {
  const { isSuccess, message, orderRef, transactionNo, amount, token } = req.body;

  if (!orderRef || !transactionNo || !amount || !token) {
    return res.status(400).json({
      success: false,
      message: "Missing required payment information"
    });
  }

  try {
    // Find the booking by orderRef
    let booking = await FlightBooking.findOne({ bookingId: orderRef });
    if (!booking) {
      booking = await Booking.findOne({ bookingId: orderRef });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Update booking with payment information
    booking.paymentDetails = {
      status: isSuccess ? "completed" : "failed",
      currency: "SYP",
      transactions: [
        ...(booking.paymentDetails?.transactions || []),
        {
          transactionNo,
          amount,
          status: isSuccess ? "completed" : "failed",
          message,
          timestamp: new Date()
        }
      ]
    };

    if (isSuccess) {
      booking.status = "confirmed";
      
      // Create payment success notification
      await Notification.create({
        userId: booking.userId,
        title: "Payment Successful",
        message: `Your payment of ${amount} SYP for booking ${orderRef} has been processed successfully.`,
        type: "payment"
      });
    } else {
      // Create payment failure notification
      await Notification.create({
        userId: booking.userId,
        title: "Payment Failed",
        message: `Your payment for booking ${orderRef} has failed. Please try again or contact support.`,
        type: "payment"
      });
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment callback processed successfully"
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment callback"
    });
  }
}); 