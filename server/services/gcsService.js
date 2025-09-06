const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Accept multiple possible env var names for bucket
const BUCKET_NAME = process.env.GCLOUD_BUCKET_NAME || process.env.GCP_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET;

// Try to load service account credentials from an env var or a local file (dev convenience)
function getServiceAccountCredentials() {
  if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.warn('gcsService: failed to parse GCP_SERVICE_ACCOUNT_JSON');
    }
  }

  // Support GOOGLE_APPLICATION_CREDENTIALS file path (the Storage client will also pick this up)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    } catch (e) {
      console.warn('gcsService: failed to parse GOOGLE_APPLICATION_CREDENTIALS file', e.message || e);
    }
  }

  // Fallback: look for a local credentials JSON shipped in the repo (dev only)
  const candidate = path.resolve(__dirname, '..', 'tourtastic-470409-fcbe4f14e1e7.json');
  if (fs.existsSync(candidate)) {
    try {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    } catch (e) {
      console.warn('gcsService: failed to parse local service account JSON', e.message || e);
    }
  }
  return undefined;
}

const creds = getServiceAccountCredentials();
const storageOptions = {};
if (creds) {
  storageOptions.projectId = creds.project_id || process.env.GCP_PROJECT_ID;
  storageOptions.credentials = creds;
}

const storage = new Storage(storageOptions);

if (!BUCKET_NAME) {
  console.warn('gcsService: bucket name not set (GCLOUD_BUCKET_NAME | GCP_BUCKET_NAME | FIREBASE_STORAGE_BUCKET)');
}

// Upload buffer and return public URL
// Retries on transient network errors (like ECONNRESET) and enforces a per-attempt timeout
async function uploadBuffer(filename, buffer, mimetype, attempts = 3, perAttemptTimeoutMs = 10000) {
  if (!BUCKET_NAME) throw new Error('GCS bucket name is not configured (set GCLOUD_BUCKET_NAME or GCP_BUCKET_NAME)');

  const bucket = storage.bucket(BUCKET_NAME);
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${path.basename(filename)}`;

  console.log('gcsService.uploadBuffer called', { BUCKET_NAME, filename, uniqueName, mimetype, size: buffer?.length, attempts });

  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const file = bucket.file(uniqueName);
    const stream = file.createWriteStream({ metadata: { contentType: mimetype }, resumable: false });

    try {
      const result = await new Promise((resolve, reject) => {
        let timeoutHandle;

        const cleanUpTimer = () => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
        };

        timeoutHandle = setTimeout(() => {
          const err = new Error(`gcsService: upload attempt ${attempt} timed out after ${perAttemptTimeoutMs}ms`);
          // destroy stream to abort
          try { stream.destroy(err); } catch (e) { /* ignore */ }
          reject(err);
        }, perAttemptTimeoutMs);

        stream.on('error', (err) => {
          cleanUpTimer();
          console.error(`gcsService: stream error on attempt ${attempt}`, err && (err.code || err.message) ? (err.code || err.message) : err);
          reject(err);
        });

        stream.on('finish', async () => {
          cleanUpTimer();
          try {
            try {
              await file.makePublic();
              const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(uniqueName)}`;
              console.log('gcsService: uploaded and made public', publicUrl);
              return resolve({ publicUrl, name: uniqueName });
            } catch (makePublicErr) {
              console.warn('gcsService: makePublic failed, attempting signed URL', makePublicErr && (makePublicErr.code || makePublicErr.message) ? (makePublicErr.code || makePublicErr.message) : makePublicErr);
              try {
                const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
                console.log('gcsService: uploaded and generated signed URL', signedUrl);
                return resolve({ publicUrl: signedUrl, name: uniqueName });
              } catch (signedErr) {
                console.error('gcsService: signed URL generation failed', signedErr);
                return reject(signedErr);
              }
            }
          } catch (err) {
            console.error('gcsService: finish handler unexpected error', err);
            return reject(err);
          }
        });

        // write buffer
        try {
          stream.end(buffer);
        } catch (endErr) {
          cleanUpTimer();
          console.error('gcsService: error ending stream', endErr && (endErr.code || endErr.message) ? (endErr.code || endErr.message) : endErr);
          return reject(endErr);
        }
      });

      // success
      return result;
    } catch (err) {
      lastErr = err;
      console.warn(`gcsService: upload attempt ${attempt} failed`, err && (err.code || err.message) ? (err.code || err.message) : err);
      // small backoff before retrying
      if (attempt < attempts) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
      console.error('gcsService: all upload attempts failed', lastErr);
      throw lastErr;
    }
  }
}

module.exports = { uploadBuffer };
