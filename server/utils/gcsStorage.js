const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Expect either GOOGLE_APPLICATION_CREDENTIALS file path or JSON in GCP_SERVICE_ACCOUNT
const getCredentials = () => {
  if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      // fallthrough
    }
  }
  return undefined;
};

const projectId = process.env.GCP_PROJECT_ID || (getCredentials() && getCredentials().project_id);
const bucketName = process.env.GCP_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET || 'flight-booking-files';

const storageOptions = {};
const creds = getCredentials();
if (creds) {
  storageOptions.projectId = projectId;
  storageOptions.credentials = creds;
}

// Fallback: if no credentials provided via GCP_SERVICE_ACCOUNT_JSON and
// GOOGLE_APPLICATION_CREDENTIALS isn't set, try to load a local JSON file
// shipped in the server folder (convenient for local dev only).
if (!storageOptions.credentials && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const candidate = path.resolve(__dirname, '..', 'tourtastic-470409-fcbe4f14e1e7.json');
  if (fs.existsSync(candidate)) {
    try {
      const localCreds = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      storageOptions.projectId = storageOptions.projectId || localCreds.project_id;
      storageOptions.credentials = localCreds;
      console.log('GCS: loaded service account from', candidate);
    } catch (e) {
      console.warn('GCS: failed to parse local service account JSON', e.message || e);
    }
  }
}

const storage = new Storage(storageOptions);
const bucket = storage.bucket(bucketName);

let _bucketChecked = false;

async function ensureBucketExists() {
  if (_bucketChecked) return;
  if (!bucketName) {
    throw new Error('GCP bucket name not configured. Set GCP_BUCKET_NAME in your environment or set FIREBASE_STORAGE_BUCKET to your bucket.');
  }
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`The configured bucket "${bucketName}" does not exist in project "${projectId || 'unknown'}". Create the bucket or update GCP_BUCKET_NAME to a valid bucket.`);
    }
    _bucketChecked = true;
  } catch (err) {
    // Re-throw with helpful message when we detect a notFound response from the API
    if (err && err.code === 404) {
      throw new Error(`The specified bucket "${bucketName}" does not exist (404). Verify GCP_BUCKET_NAME and credentials.`);
    }
    throw err;
  }
}

/**
 * Upload a local file path to the bucket and make it public
 * @param {string} localFilePath
 * @param {string} destinationPath
 * @returns {Promise<string>} public URL
 */
async function uploadFile(localFilePath, destinationPath) {
  if (!fs.existsSync(localFilePath)) throw new Error('Local file not found: ' + localFilePath);
  await ensureBucketExists();
  const options = { destination: destinationPath, resumable: false, validation: false };
  try {
    await bucket.upload(localFilePath, options);
  } catch (err) {
    // surface friendly error when bucket doesn't exist or auth fails
    if (err && err.code === 404) {
      throw new Error(`GCS upload failed: bucket "${bucketName}" not found. Set GCP_BUCKET_NAME to an existing bucket.`);
    }
    throw err;
  }
  const file = bucket.file(destinationPath);
  // try to make public
  try {
    await file.makePublic();
    return generatePublicUrl(destinationPath);
  } catch (err) {
    // If we cannot make the file public (IAM policy), generate a signed URL
    try {
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      return signedUrl;
    } catch (e) {
      // Fall back to public URL format if signed URL also fails
      return generatePublicUrl(destinationPath);
    }
  }
}

/**
 * Upload a Buffer to the bucket and make it public
 * @param {Buffer} buffer
 * @param {string} destinationPath
 * @param {string} contentType
 * @returns {Promise<string>} public URL
 */
async function uploadBuffer(buffer, destinationPath, contentType = 'application/octet-stream') {
  await ensureBucketExists();
  const file = bucket.file(destinationPath);
  try {
    await file.save(buffer, { metadata: { contentType }, resumable: false });
  } catch (err) {
    if (err && err.code === 404) {
      throw new Error(`GCS upload failed: bucket "${bucketName}" not found. Set GCP_BUCKET_NAME to an existing bucket.`);
    }
    throw err;
  }
  try {
    await file.makePublic();
    return generatePublicUrl(destinationPath);
  } catch (err) {
    try {
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      return signedUrl;
    } catch (e) {
      return generatePublicUrl(destinationPath);
    }
  }
}

/**
 * Return public URL for a file stored in the bucket
 * @param {string} fileName
 */
function generatePublicUrl(fileName) {
  return `https://storage.googleapis.com/${bucket.name}/${encodeURI(fileName)}`;
}

module.exports = {
  uploadFile,
  uploadBuffer,
  generatePublicUrl,
  bucket,
};
