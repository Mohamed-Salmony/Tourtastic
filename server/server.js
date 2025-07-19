const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

// Route files
const authRoutes = require("./routes/auth");
const destinationRoutes = require("./routes/destinations");
const bookingRoutes = require("./routes/bookings");
const newsletterRoutes = require("./routes/newsletter");
const adminRoutes = require("./routes/admin");
const cartRoutes = require("./routes/cart");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payment");
const airports = require('./routes/airports');
const notificationRoutes = require('./routes/notificationRoutes');
const flightRoutes = require('./routes/flights');

const app = express();

// Body parser middleware
app.use(express.json());

// Session middleware for anonymous cart support
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Enable CORS with specific options
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://tourtastic.vercel.app'
];

// Regex for matching Vercel URLs
const vercelRegex = /^https:\/\/.*\.vercel\.app$/;

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || vercelRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Not allowed origin - ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Session-ID'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
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
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/airports', airports);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flights', flightRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route for testing API is running
app.get("/", (req, res) => res.send("Tourtastic API Running"));

// Use error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

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
