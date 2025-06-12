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

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'  // Replace with your production domain
    : ['http://localhost:8080', 'http://127.0.0.1:8080'], // Vite dev server ports
  credentials: true, // Allow cookies if you're using sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/flights", flightRoutes); // Seeru Proxy
app.use("/api/admin", adminRoutes); // Admin routes
app.use("/api/cart", cartRoutes); // Cart routes
app.use("/api/users", userRoutes); // User routes

// Serve static files from the uploads directory (e.g., for destination images)
// Make sure the path is correct relative to where server.js is run
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route for testing API is running
app.get("/", (req, res) => res.send("Tourtastic API Running"));

// Use error handler middleware - MUST be after mounting routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; // Export for potential testing
