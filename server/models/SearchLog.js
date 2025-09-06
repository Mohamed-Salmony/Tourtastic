const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  from: { type: String },
  to: { type: String },
  searchedAt: { type: Date, default: Date.now },
  resultsCount: { type: Number, default: 0 },
  ip: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('SearchLog', SearchLogSchema);
