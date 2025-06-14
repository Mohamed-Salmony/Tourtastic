const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path"); // Needed for serving static files
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler"); // Import error handler

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

// Route files
const authRoutes = require("./routes/auth");
const destinationRoutes = require("./routes/destinations");
const bookingRoutes = require("./routes/bookings");
const newsletterRoutes = require("./routes/newsletter");
const flightRoutes = require("./routes/flights");
const adminRoutes = require("./routes/admin");
const cartRoutes = require("./routes/cart");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payment");
const airports = require('./routes/airports');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS with specific options
const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://tourtastic.vercel.app'
];

// Regex لمطابقة أي رابط من Vercel
const vercelRegex = /^https:\/\/.*\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || // السماح لأدوات مثل Postman
      allowedOrigins.includes(origin) ||
      vercelRegex.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Not allowed origin - ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/airports', airports);
app.use('/api/notifications', notificationRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route for testing API is running
app.get("/", (req, res) => res.send("Tourtastic API Running"));

// Use error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
