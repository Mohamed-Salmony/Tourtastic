/**
 * Migration Script: Cloudinary → Supabase Storage
 * 
 * This script migrates files from Cloudinary to Supabase Storage in batches.
 * It preserves the original folder structure and logs success/failure for each file.
 * 
 * Usage:
 *   node scripts/migrateToSupabase.js [--dry-run] [--batch-size=10] [--models=destinations,notifications]
 * 
 * Options:
 *   --dry-run: Preview migration without actually uploading to Supabase
 *   --batch-size: Number of files to process in each batch (default: 10)
 *   --models: Comma-separated list of models to migrate (default: all)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const supabaseStorage = require('../utils/supabaseStorage');
const fs = require('fs');
const path = require('path');

// Command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 10;
const modelsArg = args.find(arg => arg.startsWith('--models='));
const MODELS_TO_MIGRATE = modelsArg ? modelsArg.split('=')[1].split(',') : ['destinations', 'notifications'];

// Log file
const LOG_FILE = path.join(__dirname, `migration-log-${Date.now()}.json`);
const migrationLog = {
  startTime: new Date().toISOString(),
  endTime: null,
  isDryRun,
  batchSize: BATCH_SIZE,
  models: MODELS_TO_MIGRATE,
  totalFiles: 0,
  successCount: 0,
  failureCount: 0,
  skippedCount: 0,
  files: []
};

// Save log to file
function saveLog() {
  migrationLog.endTime = new Date().toISOString();
  fs.writeFileSync(LOG_FILE, JSON.stringify(migrationLog, null, 2));
  console.log(`\n📄 Migration log saved to: ${LOG_FILE}`);
}

// Log a file migration result
function logFile(modelName, documentId, field, oldUrl, newUrl, status, error = null) {
  const entry = {
    model: modelName,
    documentId: String(documentId),
    field,
    oldUrl,
    newUrl,
    status, // 'success' | 'failed' | 'skipped'
    error,
    timestamp: new Date().toISOString()
  };
  
  migrationLog.files.push(entry);
  
  if (status === 'success') {
    migrationLog.successCount++;
    console.log(`  ✅ ${modelName}[${documentId}].${field}`);
  } else if (status === 'failed') {
    migrationLog.failureCount++;
    console.error(`  ❌ ${modelName}[${documentId}].${field}: ${error}`);
  } else if (status === 'skipped') {
    migrationLog.skippedCount++;
    console.log(`  ⏭️  ${modelName}[${documentId}].${field}: ${error || 'Already migrated or not a Cloudinary URL'}`);
  }
}

// Download file from URL
async function downloadFile(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: 100 * 1024 * 1024 // 100MB max
  });
  return Buffer.from(response.data);
}

// Extract folder and filename from Cloudinary URL
function parseCloudinaryUrl(url) {
  try {
    // Example: https://res.cloudinary.com/dyry05xvj/image/upload/v1234567890/destinations/abc.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.*)/);
    if (match && match[1]) {
      return match[1]; // e.g., 'destinations/abc.jpg'
    }
    // Fallback: use path from URL
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').slice(-2).join('/'); // Last two segments
  } catch (err) {
    console.error('Failed to parse Cloudinary URL:', url, err);
    return `unknown/${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  }
}

// Migrate a single file
async function migrateFile(url, modelName, documentId, field) {
  migrationLog.totalFiles++;

  // Skip if not a Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    logFile(modelName, documentId, field, url, null, 'skipped', 'Not a Cloudinary URL');
    return null;
  }

  // Skip if already migrated to Supabase
  if (url.startsWith('supabase://')) {
    logFile(modelName, documentId, field, url, null, 'skipped', 'Already migrated');
    return null;
  }

  try {
    if (isDryRun) {
      console.log(`  🔍 [DRY RUN] Would migrate: ${url}`);
      logFile(modelName, documentId, field, url, '[DRY-RUN]', 'success');
      return '[DRY-RUN]';
    }

    // Download file from Cloudinary
    const buffer = await downloadFile(url);
    
    // Determine destination path (preserve folder structure)
    const destinationPath = parseCloudinaryUrl(url);
    
    // Detect content type from URL extension
    const ext = path.extname(destinationPath).toLowerCase();
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.webp': 'image/webp'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Upload to Supabase
    const newUrl = await supabaseStorage.uploadBuffer(buffer, destinationPath, contentType);
    
    logFile(modelName, documentId, field, url, newUrl, 'success');
    return newUrl;
  } catch (err) {
    logFile(modelName, documentId, field, url, null, 'failed', err.message);
    return null;
  }
}

// Migrate Destination model
async function migrateDestinations() {
  if (!MODELS_TO_MIGRATE.includes('destinations')) {
    console.log('\n⏭️  Skipping Destinations (not in models list)');
    return;
  }

  console.log('\n📦 Migrating Destinations...');
  const Destination = require('../models/Destination');
  
  const destinations = await Destination.find({}).lean();
  console.log(`Found ${destinations.length} destinations`);
  
  for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
    const batch = destinations.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(destinations.length / BATCH_SIZE)}`);
    
    for (const dest of batch) {
      if (dest.image) {
        const newUrl = await migrateFile(dest.image, 'Destination', dest._id, 'image');
        
        // Update database if successful and not dry run
        if (newUrl && newUrl !== '[DRY-RUN]') {
          await Destination.updateOne(
            { _id: dest._id },
            { 
              $set: { 
                image: newUrl,
                storage_provider: 'supabase'
              }
            }
          );
        }
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Migrate Notification model
async function migrateNotifications() {
  if (!MODELS_TO_MIGRATE.includes('notifications')) {
    console.log('\n⏭️  Skipping Notifications (not in models list)');
    return;
  }

  console.log('\n📦 Migrating Notifications...');
  const Notification = require('../models/Notification');
  
  const notifications = await Notification.find({ pdfUrl: { $exists: true, $ne: null } }).lean();
  console.log(`Found ${notifications.length} notifications with PDFs`);
  
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(notifications.length / BATCH_SIZE)}`);
    
    for (const notif of batch) {
      if (notif.pdfUrl) {
        const newUrl = await migrateFile(notif.pdfUrl, 'Notification', notif._id, 'pdfUrl');
        
        // Update database if successful and not dry run
        if (newUrl && newUrl !== '[DRY-RUN]') {
          await Notification.updateOne(
            { _id: notif._id },
            { 
              $set: { 
                pdfUrl: newUrl,
                storage_provider: 'supabase'
              }
            }
          );
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Migrate Booking model (ticket files)
async function migrateBookings() {
  if (!MODELS_TO_MIGRATE.includes('bookings')) {
    console.log('\n⏭️  Skipping Bookings (not in models list)');
    return;
  }

  console.log('\n📦 Migrating Bookings (ticket files)...');
  const Booking = require('../models/Booking');
  
  const bookings = await Booking.find({ 'ticketInfo.filePath': { $exists: true } }).lean();
  console.log(`Found ${bookings.length} bookings with ticket files`);
  
  for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
    const batch = bookings.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bookings.length / BATCH_SIZE)}`);
    
    for (const booking of batch) {
      const filePath = booking.ticketInfo?.filePath;
      if (filePath && typeof filePath === 'string') {
        const newUrl = await migrateFile(filePath, 'Booking', booking._id, 'ticketInfo.filePath');
        
        if (newUrl && newUrl !== '[DRY-RUN]') {
          await Booking.updateOne(
            { _id: booking._id },
            { 
              $set: { 
                'ticketInfo.filePath': newUrl,
                storage_provider: 'supabase'
              }
            }
          );
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting migration from Cloudinary to Supabase Storage\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no actual uploads)' : 'LIVE MIGRATION'}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Models: ${MODELS_TO_MIGRATE.join(', ')}`);
  
  try {
    // Connect to MongoDB
    console.log('\n📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Run migrations
    await migrateDestinations();
    await migrateNotifications();
    await migrateBookings();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Files:    ${migrationLog.totalFiles}`);
    console.log(`✅ Success:     ${migrationLog.successCount}`);
    console.log(`❌ Failed:      ${migrationLog.failureCount}`);
    console.log(`⏭️  Skipped:     ${migrationLog.skippedCount}`);
    console.log('='.repeat(60));
    
    saveLog();
    
    if (isDryRun) {
      console.log('\n💡 This was a DRY RUN. No files were actually migrated.');
      console.log('   Remove --dry-run flag to perform the actual migration.');
    } else {
      console.log('\n✅ Migration completed!');
      if (migrationLog.failureCount > 0) {
        console.log(`⚠️  ${migrationLog.failureCount} files failed. Check the log file for details.`);
      }
    }
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    saveLog();
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Handle errors and graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  saveLog();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('\n❌ Unhandled rejection:', err);
  saveLog();
  process.exit(1);
});

// Run migration
runMigration();
