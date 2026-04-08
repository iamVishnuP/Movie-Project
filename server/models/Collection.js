const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  filters: {
    genres: [String],
    languages: [String]
  },
  movies: [{ 
    id: { type: String, required: true },
    title: { type: String, required: true },
    posterPath: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
