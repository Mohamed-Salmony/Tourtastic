const asyncHandler = require("../middleware/asyncHandler");
const FlightBooking = require("../models/FlightBooking");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const crypto = require('crypto');

// Load payment config from environment
const ECASH_PAYMENT_GATEWAY_URL = process.env.ECASH_PAYMENT_GATEWAY_URL || 'https://checkout.ecash-pay.com';
const TERMINAL_KEY = process.env.TERMINAL_KEY || '';
const MERCHANT_KEY = process.env.MERCHANT_KEY || '';
const MERCHANT_SECRET = process.env.MERCHANT_SECRET || '';
const SERVER_PUBLIC_URL = process.env.SERVER_PUBLIC_URL || '';

function md5Upper(input) {
  return crypto.createHash('md5').update(input, 'utf8').digest('hex').toUpperCase();
}

function buildVerificationCode(amount, orderRef) {
  // vc = MD5(mid + secret + amount + orderRef)
  return md5Upper(`${MERCHANT_KEY}${MERCHANT_SECRET}${amount}${orderRef}`);
}

function buildExpectedCallbackToken(transactionNo, amount, orderRef) {
  // token = MD5(mid + secret + transactionNo + amount + orderRef)
  return md5Upper(`${MERCHANT_KEY}${MERCHANT_SECRET}${transactionNo}${amount}${orderRef}`);
}

// @desc    Initiate ECash payment (server-side)
// @route   POST /api/payment/initiate
// @access  Private (requires authenticated user) but can be relaxed as needed
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { amount, orderRef, returnUrl } = req.body || {};
  if (!TERMINAL_KEY || !MERCHANT_KEY || !MERCHANT_SECRET) {
    return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
  }
  if (!amount || !orderRef) {
    return res.status(400).json({ success: false, message: 'Missing amount or orderRef' });
  }

  // Build verification and URLs
  const verificationCode = buildVerificationCode(amount, orderRef);
  const ru = encodeURIComponent(returnUrl || `${SERVER_PUBLIC_URL}/payment/success`);
  // callback must point to server public URL
  const cu = encodeURIComponent(`${SERVER_PUBLIC_URL}/api/payment/callback`);

  const paymentUrl = `${ECASH_PAYMENT_GATEWAY_URL}/Checkout/CardCheckout?tk=${TERMINAL_KEY}&mid=${MERCHANT_KEY}&vc=${verificationCode}&c=SYP&a=${amount}&lang=EN&or=${orderRef}&ru=${ru}&cu=${cu}`;
  return res.status(200).json({ success: true, url: paymentUrl });
});

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
    // Verify callback token
    if (!MERCHANT_KEY || !MERCHANT_SECRET) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
    }
    const expectedToken = buildExpectedCallbackToken(String(transactionNo || ''), Number(amount || 0), String(orderRef || ''));
    if (!token || String(token).toUpperCase() !== expectedToken) {
      return res.status(400).json({ success: false, message: 'Invalid callback token' });
    }

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
        title: {
          en: "Payment Successful",
          ar: "تمت عملية الدفع بنجاح"
        },
        message: {
          en: `Your payment of ${amount} SYP for booking ${orderRef} has been processed successfully.`,
          ar: `تم معالجة دفعتك البالغة ${amount} ليرة سورية للحجز ${orderRef} بنجاح.`
        },
        type: "payment"
      });
    } else {
      // Create payment failure notification
      await Notification.create({
        userId: booking.userId,
        title: {
          en: "Payment Failed",
          ar: "فشلت عملية الدفع"
        },
        message: {
          en: `Your payment for booking ${orderRef} has failed. Please try again or contact support.`,
          ar: `فشلت عملية الدفع للحجز ${orderRef}. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.`
        },
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