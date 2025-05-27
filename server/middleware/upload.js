const multer = require("multer");
const path = require("path");

// Configure storage for uploaded files (e.g., tickets, destination images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define destination based on file type or route context if needed
    let uploadPath = "./uploads/"; // Default upload directory
    if (file.fieldname === "ticketPdf") {
        uploadPath = "./uploads/tickets/";
    } else if (file.fieldname === "destinationImage") {
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
  if (file.fieldname === "ticketPdf") {
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
  } else {
    // Allow other file types or reject by default
    cb(null, false); 
  }
};

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // Limit file size (e.g., 10MB)
  },
});

module.exports = upload;
