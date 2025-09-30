/**
 * Storage Routes
 * 
 * Provides utility endpoints for storage operations:
 * - Generate signed URLs for Supabase files
 * - Get storage provider info
 */

const express = require('express');
const router = express.Router();
const { getAccessibleUrl } = require('../utils/urlHelper');

/**
 * @route   GET /api/storage/signed-url
 * @desc    Generate a signed URL for a storage file
 * @access  Public (could be protected if needed)
 * @query   path - Storage path (e.g., 'supabase://bucket/file.jpg' or Cloudinary URL)
 * @query   expiresIn - Optional expiry time in seconds (default: 3600)
 */
router.get('/signed-url', async (req, res) => {
  try {
    const { path, expiresIn } = req.query;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: path'
      });
    }

    const expiry = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const signedUrl = await getAccessibleUrl(path, expiry);

    res.json({
      success: true,
      signedUrl,
      expiresIn: expiry,
      provider: 'supabase'
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate signed URL'
    });
  }
});

/**
 * @route   POST /api/storage/signed-urls
 * @desc    Generate signed URLs for multiple files
 * @access  Public
 * @body    paths - Array of storage paths
 * @body    expiresIn - Optional expiry time in seconds
 */
router.post('/signed-urls', async (req, res) => {
  try {
    const { paths, expiresIn } = req.body;

    if (!Array.isArray(paths)) {
      return res.status(400).json({
        success: false,
        error: 'paths must be an array'
      });
    }

    const expiry = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const signedUrls = await Promise.all(
      paths.map(async (path) => {
        try {
          const url = await getAccessibleUrl(path, expiry);
          return { path, signedUrl: url, success: true };
        } catch (err) {
          return { path, error: err.message, success: false };
        }
      })
    );

    res.json({
      success: true,
      results: signedUrls,
      expiresIn: expiry,
      provider: 'supabase'
    });
  } catch (error) {
    console.error('Error generating signed URLs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate signed URLs'
    });
  }
});

/**
 * @route   GET /api/storage/info
 * @desc    Get current storage provider information
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    provider: 'supabase',
    bucket: process.env.SUPABASE_BUCKET || 'tourtastic-files',
    features: {
      privateAccess: true,
      signedUrls: true,
      directAccess: false
    }
  });
});

module.exports = router;
