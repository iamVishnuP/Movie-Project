const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  characterName: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  selectedGenres: [{ type: String }],
  selectedLanguages: [{ type: String }],
  profileImage: { type: String },
  favoriteDirectors: [{
    id: { type: String },
    name: { type: String },
    profilePath: { type: String }
  }],
  favoriteMovies: [{
    id: { type: String },
    title: { type: String },
    posterPath: { type: String }
  }],
  watchlist: [{
    movieId: { type: String },
    title: { type: String },
    posterPath: { type: String },
    status: { type: String, enum: ['pending', 'watched'], default: 'pending' },
    rating: { type: Number },
    review: { type: String }
  }]
}, { timestamps: true });

// Explicit case-insensitive unique index on characterName
userSchema.index({ characterName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

userSchema.pre('save', async function () {
  if (this.isModified('characterName')) {
    this.characterName = this.characterName.toLowerCase();
  }
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
