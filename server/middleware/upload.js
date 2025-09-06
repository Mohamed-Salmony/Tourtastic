const multer = require("multer");
const path = require("path");

// Configure storage for uploaded files (e.g., tickets, destination images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define destination based on file type or route context if needed
    let uploadPath = "./uploads/"; // Default upload directory
  if (file.fieldname === "ticketPdf" || file.fieldname === "ticketFile") {
        uploadPath = "./uploads/tickets/";
    } else if (file.fieldname === "destinationImage") {
        uploadPath = "./uploads/destinations/";
    } else if (file.fieldname === "image") {
      // Accept legacy/client alias 'image' for destination uploads
      uploadPath = "./uploads/destinations/";
    }
    // Ensure directory exists (create if not)
    const fs = require("fs");
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter function (example: allow only PDFs for tickets, images for destinations)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "ticketPdf" || file.fieldname === "ticketFile") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for tickets!"), false);
    }
  } else if (file.fieldname === "destinationImage") {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for destinations!"), false);
    }
  } else if (file.fieldname === "image") {
    // Accept alias 'image' same as 'destinationImage'
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for destinations!"), false);
    }
  } else {
    // Allow other file types or reject by default
    cb(null, false); 
  }
};

// Determine max upload size (env override allowed). Default to 50MB to accommodate typical PDF e-tickets.
const DEFAULT_UPLOAD_MAX_FILE_SIZE = process.env.UPLOAD_MAX_FILE_SIZE
  ? parseInt(process.env.UPLOAD_MAX_FILE_SIZE, 10)
  : 1024 * 1024 * 50; // 50 MB

// Log the configured size at startup so it's easy to spot in server logs
try {
  // Using console.info so it's visible without being an error

} catch (e) {
  // ignore logging failures
}

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // Allow configuring max upload size via env var UPLOAD_MAX_FILE_SIZE (in bytes).
    // Defaults to 50MB (50 * 1024 * 1024).
    fileSize: DEFAULT_UPLOAD_MAX_FILE_SIZE,
  },
});

module.exports = upload;
