const path = require('path');
const supabaseStorage = require('../utils/supabaseStorage');

const DEFAULT_FOLDER = process.env.NOTIFICATIONS_FOLDER || 'notifications';

async function uploadBuffer(filename, buffer, mimetype) {
  const baseName = path.basename(filename).replace(/[\s]+/g, '_');
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}`;
  const destPath = `${DEFAULT_FOLDER}/${uniqueName}`;
  
  const storagePath = await supabaseStorage.uploadBuffer(buffer, destPath, mimetype);
  return { publicUrl: storagePath, name: uniqueName };
}

module.exports = { uploadBuffer };
