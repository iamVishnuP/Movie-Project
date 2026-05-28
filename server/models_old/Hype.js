const mongoose = require('mongoose');

const hypeSchema = new mongoose.Schema({
  movieId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hypedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hypeCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Hype', hypeSchema);
