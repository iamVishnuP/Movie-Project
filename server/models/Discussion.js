const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    posterPath: { type: String }
  },
  caption: { type: String, required: true },
  thoughts: { type: String, required: true },
  image: { type: String }, // Custom uploaded image URL
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invited: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['draft', 'active'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Discussion', discussionSchema);
