const Setting = require('../models/Setting');
const asyncHandler = require('../middleware/asyncHandler');

// Get setting by key (public read)
exports.getSetting = asyncHandler(async (req, res, next) => {
  const key = req.params.key;
  const setting = await Setting.findOne({ key }).lean();
  res.status(200).json({ success: true, data: setting ? setting.value : null });
});

// Upsert setting (admin only)
exports.upsertSetting = asyncHandler(async (req, res, next) => {
  const key = req.params.key;
  const { value } = req.body;
  const updated = await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.status(200).json({ success: true, data: updated });
});
