const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler"); // Import error handler
const mongoose = require("mongoose"); // Import mongoose for database connection status
const logger = require("./config/logger"); // Import logger

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

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));

// Enable CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://tourtastic-vxo1.onrender.com'
    : ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:8080'], // Development ports
  credentials: true, // Allow cookies if you're using sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/flights", flightRoutes); // Seeru Proxy
app.use("/api/admin", adminRoutes); // Admin routes
app.use("/api/cart", cartRoutes); // Cart routes

// Serve static files from the uploads directory (e.g., for destination images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Define paths for static files
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  console.log('Attempting to serve static files from:', clientBuildPath);
  
  // Configure security for static files
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false
    })
  );
  
  // Serve static files from the client build directory
  app.use(express.static(clientBuildPath));
  
  // Handle client-side routing - make sure this route doesn't conflict with API routes
  app.get(/^(?!\/api|\/healthz|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Health check endpoint
app.get("/healthz", (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: "UP",
    timestamp: Date.now(),
    mongoStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  };
  try {
    res.send(healthcheck);
  } catch (e) {
    healthcheck.status = "DOWN";
    healthcheck.error = e;
    res.status(503).send(healthcheck);
  }
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Don't crash the server, but log the error
  console.log("Server continuing despite error...");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Don't crash the server, but log the error
  console.log("Server continuing despite error...");
});

module.exports = server;
