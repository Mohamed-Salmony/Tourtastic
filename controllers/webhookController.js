const asyncHandler = require("../middleware/asyncHandler");
const Booking = require("../models/Booking");

exports.handleWebhook = asyncHandler(async (req, res, next) => {
    // Verify webhook source (implement proper validation)
    const seeruSignature = req.headers['x-seeru-signature'];
    if (!seeruSignature) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized webhook request' 
        });
    }

    const eventType = req.body.type;
    const eventData = req.body.data;

    console.log('Received webhook:', {
        type: eventType,
        data: eventData
    });

    switch (eventType) {
        case 'booking.confirmed':
            await handleBookingConfirmed(eventData);
            break;
        case 'booking.cancelled':
            await handleBookingCancelled(eventData);
            break;
        case 'booking.updated':
            await handleBookingUpdated(eventData);
            break;
        default:
            console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
        success: true, 
        message: 'Webhook processed successfully' 
    });
});

async function handleBookingConfirmed(data) {
    try {
        const booking = await Booking.findOne({ 
            'details.seeruBookingId': data.bookingId 
        });
        
        if (booking) {
            booking.status = 'confirmed';
            booking.details.seeruConfirmationData = data;
            await booking.save();
            
            // TODO: Send confirmation email to customer
        }
    } catch (error) {
        console.error('Error handling booking confirmation:', error);
    }
}

async function handleBookingCancelled(data) {
    try {
        const booking = await Booking.findOne({ 
            'details.seeruBookingId': data.bookingId 
        });
        
        if (booking) {
            booking.status = 'cancelled';
            booking.details.seeruCancellationData = data;
            await booking.save();
            
            // TODO: Send cancellation email to customer
        }
    } catch (error) {
        console.error('Error handling booking cancellation:', error);
    }
}

async function handleBookingUpdated(data) {
    try {
        const booking = await Booking.findOne({ 
            'details.seeruBookingId': data.bookingId 
        });
        
        if (booking) {
            booking.details.seeruUpdateData = data;
            await booking.save();
            
            // TODO: Send update notification to customer if needed
        }
    } catch (error) {
        console.error('Error handling booking update:', error);
    }
}