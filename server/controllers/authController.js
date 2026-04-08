const User = require('../models/User');
const jwt = require('jsonwebtoken');

const sendOTPEmail = async (toEmail, subject, otp) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Movie Discovery', email: process.env.MAIL_USER },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <h2 style="color: #ffd700;">Welcome to Movie Discovery!</h2>
          <p>Your OTP for account verification is:</p>
          <h1 style="background-color: #fff; padding: 10px; display: inline-block; border-radius: 5px; border: 1px solid #ffd700;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo API error: ${errText}`);
  }
  return response.json();
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.signup = async (req, res) => {
  try {
    const { name, email, password, characterName, profileImage } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const existingChar = await User.findOne({ characterName: characterName.toLowerCase() });
    if (existingChar) return res.status(400).json({ message: 'Character name already taken' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({ name, email, password, characterName, otp, otpExpires, profileImage });
    await newUser.save();

    try {
      await sendOTPEmail(email, 'Movie Discovery - OTP Verification', otp);
      console.log('Email sent successfully via Brevo');
    } catch (emailErr) {
      console.error('Brevo encountered an error:', emailErr.message);
    }
    
    console.log(`\n================================`);
    console.log(`OTP for ${email} is: ${otp}`);
    console.log(`================================\n`);

    res.status(201).json({ message: 'OTP sent to email. Please verify.' });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'characterName') return res.status(400).json({ message: 'Character name already taken' });
      if (field === 'email') return res.status(400).json({ message: 'User already exists with this email' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      await sendOTPEmail(email, 'Movie Discovery - Resend OTP', otp);
      console.log('Resend OTP sent successfully via Brevo');
    } catch (emailErr) {
      console.error('Brevo encountered an error during resend-otp:', emailErr.message);
    }

    console.log(`\n================================`);
    console.log(`NEW OTP for ${email} is: ${otp}`);
    console.log(`================================\n`);

    res.json({ message: 'New OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const userProfile = {
      id: user._id,
      name: user.name,
      characterName: user.characterName,
      email: user.email,
      isVerified: user.isVerified,
      selectedGenres: user.selectedGenres,
      selectedLanguages: user.selectedLanguages,
      profileImage: user.profileImage,
      favoriteDirectors: user.favoriteDirectors,
      favoriteMovies: user.favoriteMovies,
      watchlist: user.watchlist
    };
    res.json({ token, user: userProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ message: 'Account not verified' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const userProfile = {
      id: user._id,
      name: user.name,
      characterName: user.characterName,
      email: user.email,
      isVerified: user.isVerified,
      selectedGenres: user.selectedGenres,
      selectedLanguages: user.selectedLanguages,
      profileImage: user.profileImage,
      favoriteDirectors: user.favoriteDirectors,
      favoriteMovies: user.favoriteMovies,
      watchlist: user.watchlist
    };
    res.json({ token, user: userProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, characterName, selectedGenres, selectedLanguages, favoriteDirectors, favoriteMovies, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (characterName) {
      const existingChar = await User.findOne({ characterName: characterName.toLowerCase(), _id: { $ne: req.user.id } });
      if (existingChar) return res.status(400).json({ message: 'Character name already taken' });
      user.characterName = characterName;
    }
    if (selectedGenres) user.selectedGenres = selectedGenres;
    if (selectedLanguages) user.selectedLanguages = selectedLanguages;
    if (favoriteDirectors) user.favoriteDirectors = favoriteDirectors;
    if (favoriteMovies) user.favoriteMovies = favoriteMovies;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: user._id,
        name: user.name,
        characterName: user.characterName,
        email: user.email,
        selectedGenres: user.selectedGenres,
        selectedLanguages: user.selectedLanguages,
        profileImage: user.profileImage,
        favoriteDirectors: user.favoriteDirectors,
        favoriteMovies: user.favoriteMovies
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
