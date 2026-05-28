const mongoose = require('mongoose');

const discussionPostSchema = new mongoose.Schema({
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  imageUrl: { type: String },
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionPost', default: null }, // for nesting
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('DiscussionPost', discussionPostSchema);
