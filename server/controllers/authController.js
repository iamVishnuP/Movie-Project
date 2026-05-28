const { db, auth, admin } = require('../utils/firebase');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../utils/cloudinary');
const { usersIndex } = require('../utils/algolia');

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
        <div style="background-color: #000; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%); border: 2px solid #ffd700; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="background-color: #ffd700; padding: 15px; color: #000; font-weight: 900; letter-spacing: 5px; text-transform: uppercase; font-size: 14px;">
              Admit One - Movie Discovery
            </div>
            
            <div style="padding: 40px 20px;">
              <div style="color: #ffd700; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px;">
                Your Access Code
              </div>
              <div style="color: #fff; font-size: 48px; font-weight: 900; letter-spacing: 15px; margin: 20px 0; padding: 20px; border-top: 1px dashed #333; border-bottom: 1px dashed #333; background-color: rgba(255,215,0,0.05);">
                ${otp}
              </div>
              <div style="color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px;">
                Valid for 10 Minutes Only
              </div>
            </div>

            <div style="background-color: #111; padding: 20px; border-top: 1px solid #222;">
              <p style="color: #ffd700; font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                Enjoy the Show
              </p>
              <p style="color: #444; font-size: 10px; margin-top: 10px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
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
    const { name, email: rawEmail, password, characterName, profileImage } = req.body;
    const email = rawEmail.toLowerCase().trim();
    const charNameLower = characterName.toLowerCase();
    
    // Check if character name exists in Firestore
    const charSnapshot = await db.collection('users').where('characterNameLower', '==', charNameLower).get();
    if (!charSnapshot.empty) {
      return res.status(400).json({ message: 'Character name already taken' });
    }

    // Check if email already in use
    const emailSnapshot = await db.collection('users').where('email', '==', email).get();
    let existingUserDoc = null;
    let existingUserId = null;
    if (!emailSnapshot.empty) {
      existingUserDoc = emailSnapshot.docs[0].data();
      existingUserId = emailSnapshot.docs[0].id;
      if (existingUserDoc.isVerified) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 15 * 60 * 1000;

    let finalProfileImage = profileImage;
    if (profileImage && profileImage.startsWith('data:image')) {
      finalProfileImage = await uploadImage(profileImage, 'profiles');
    }

    if (existingUserId) {
      // Update unverified user
      await db.collection('users').doc(existingUserId).update({
        name: name || existingUserDoc.name,
        password: password || existingUserDoc.password, // Temporarily store password (hashed later or moved to auth)
        otp,
        otpExpires,
        characterName,
        characterNameLower: charNameLower,
        profileImage: finalProfileImage || existingUserDoc.profileImage
      });
    } else {
      // Create new unverified user doc
      await db.collection('users').add({
        name,
        email,
        password, // Temporarily store password in firestore before verification
        characterName,
        characterNameLower: charNameLower,
        otp,
        otpExpires,
        profileImage: finalProfileImage,
        isVerified: false,
        selectedGenres: [],
        selectedLanguages: [],
        favoriteDirectors: [],
        favoriteMovies: [],
        watchlist: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    try {
      await sendOTPEmail(email, existingUserId ? 'Movie Discovery - New OTP Verification' : 'Movie Discovery - OTP Verification', otp);
      console.log('Email sent successfully via Brevo');
    } catch (emailErr) {
      console.error('Brevo encountered an error:', emailErr.message);
    }
    
    console.log(`\n================================`);
    console.log(`OTP for ${email} is: ${otp}`);
    console.log(`================================\n`);

    res.status(201).json({ message: 'OTP sent to email. Please verify.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(404).json({ message: 'User not found' });
    
    const userId = snapshot.docs[0].id;
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    await db.collection('users').doc(userId).update({
      otp,
      otpExpires,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

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

exports.verifyOTP = async (req, res) => {
  try {
    const { email: rawEmail, otp: rawOtp } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    const otp = rawOtp?.toString().trim();

    console.log(`Verifying OTP for ${email}: ${otp}`);

    const snapshot = await db.collection('users').where('email', '==', email).where('otp', '==', otp).get();
    
    if (snapshot.empty) {
      console.log('OTP Verification Failed: User/OTP mismatch');
      return res.status(400).json({ message: 'Invalid OTP or Email' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.otpExpires < Date.now()) {
      console.log('OTP Verification Failed: Expired');
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Now create user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      // Update password if they resinged up
      if (userData.password) {
        await auth.updateUser(firebaseUser.uid, { password: userData.password });
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        firebaseUser = await auth.createUser({
          uid: userId, // Keep same ID as Firestore
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
          emailVerified: true
        });
      } else {
        throw e;
      }
    }

    await db.collection('users').doc(userId).update({
      isVerified: true,
      otp: admin.firestore.FieldValue.delete(),
      otpExpires: admin.firestore.FieldValue.delete(),
      password: admin.firestore.FieldValue.delete(), // Remove cleartext password from firestore
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add to Algolia
    try {
      await usersIndex.saveObject({
        objectID: userId,
        name: userData.name,
        characterName: userData.characterName,
        email: userData.email,
        profileImage: userData.profileImage,
        selectedGenres: userData.selectedGenres,
        selectedLanguages: userData.selectedLanguages,
        favoriteDirectors: userData.favoriteDirectors,
        favoriteMovies: userData.favoriteMovies
      });
    } catch (algoliaErr) {
      console.error('Algolia sync error:', algoliaErr);
    }

    // Keep JWT for frontend compatibility
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const userProfile = {
      id: userId,
      name: userData.name,
      characterName: userData.characterName,
      email: userData.email,
      isVerified: true,
      selectedGenres: userData.selectedGenres || [],
      selectedLanguages: userData.selectedLanguages || [],
      profileImage: userData.profileImage,
      favoriteDirectors: userData.favoriteDirectors || [],
      favoriteMovies: userData.favoriteMovies || [],
      watchlist: userData.watchlist || []
    };
    res.json({ token, user: userProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase().trim();
    
    // Authenticate via Firebase REST API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    
    const authData = await response.json();
    if (!response.ok) {
      if (authData.error && (authData.error.message === 'INVALID_LOGIN_CREDENTIALS' || authData.error.message === 'INVALID_PASSWORD' || authData.error.message === 'EMAIL_NOT_FOUND')) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.status(401).json({ message: authData.error.message || 'Invalid credentials' });
    }

    const userId = authData.localId;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found in database' });
    
    const userData = userDoc.data();
    if (!userData.isVerified) return res.status(400).json({ message: 'Account not verified' });

    // Use custom JWT
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const userProfile = {
      id: userId,
      name: userData.name,
      characterName: userData.characterName,
      email: userData.email,
      isVerified: userData.isVerified,
      selectedGenres: userData.selectedGenres || [],
      selectedLanguages: userData.selectedLanguages || [],
      profileImage: userData.profileImage,
      favoriteDirectors: userData.favoriteDirectors || [],
      favoriteMovies: userData.favoriteMovies || [],
      watchlist: userData.watchlist || []
    };
    res.json({ token, user: userProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, characterName, selectedGenres, selectedLanguages, favoriteDirectors, favoriteMovies, profileImage } = req.body;
    const userId = req.user.id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const userData = userDoc.data();

    let updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    let algoliaUpdates = { objectID: userId };

    if (name) { updates.name = name; algoliaUpdates.name = name; }
    if (characterName) {
      const charNameLower = characterName.toLowerCase();
      const existingChar = await db.collection('users').where('characterNameLower', '==', charNameLower).get();
      if (!existingChar.empty && existingChar.docs[0].id !== userId) {
        return res.status(400).json({ message: 'Character name already taken' });
      }
      updates.characterName = characterName;
      updates.characterNameLower = charNameLower;
      algoliaUpdates.characterName = characterName;
    }
    if (selectedGenres) { updates.selectedGenres = selectedGenres; algoliaUpdates.selectedGenres = selectedGenres; }
    if (selectedLanguages) { updates.selectedLanguages = selectedLanguages; algoliaUpdates.selectedLanguages = selectedLanguages; }
    if (favoriteDirectors) { updates.favoriteDirectors = favoriteDirectors; algoliaUpdates.favoriteDirectors = favoriteDirectors; }
    if (favoriteMovies) { updates.favoriteMovies = favoriteMovies; algoliaUpdates.favoriteMovies = favoriteMovies; }
    if (profileImage) {
      if (profileImage.startsWith('data:image')) {
        updates.profileImage = await uploadImage(profileImage, 'profiles');
      } else {
        updates.profileImage = profileImage;
      }
      algoliaUpdates.profileImage = updates.profileImage;
    }

    await userRef.update(updates);
    
    // Update Algolia
    try {
      await usersIndex.partialUpdateObject(algoliaUpdates);
    } catch (algoliaErr) {
      console.error('Algolia update error:', algoliaErr);
    }

    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();

    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: userId,
        name: updatedData.name,
        characterName: updatedData.characterName,
        email: updatedData.email,
        selectedGenres: updatedData.selectedGenres,
        selectedLanguages: updatedData.selectedLanguages,
        profileImage: updatedData.profileImage,
        favoriteDirectors: updatedData.favoriteDirectors,
        favoriteMovies: updatedData.favoriteMovies
      }
    });
  } catch (error) {
    require('fs').appendFileSync('error.log', 'UPDATE_PROFILE_ERROR: ' + (error.stack || error.message) + '\n');
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(rfToken, process.env.REFRESH_TOKEN_SECRET);
    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) return res.status(401).json({ message: 'Invalid refresh token' });

    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(401).json({ message: 'User not found' });
    const userData = userDoc.data();
    
    const userProfile = {
      id: req.user.id,
      name: userData.name,
      characterName: userData.characterName,
      email: userData.email,
      isVerified: userData.isVerified,
      selectedGenres: userData.selectedGenres || [],
      selectedLanguages: userData.selectedLanguages || [],
      profileImage: userData.profileImage,
      favoriteDirectors: userData.favoriteDirectors || [],
      favoriteMovies: userData.favoriteMovies || [],
      watchlist: userData.watchlist || []
    };
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await auth.deleteUser(userId);
    await db.collection('users').doc(userId).delete();
    
    // Delete from Algolia
    try {
      await usersIndex.deleteObject(userId);
    } catch (err) {
      console.error('Algolia delete error:', err);
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Movie Discovery', email: process.env.MAIL_USER },
      to: [{ email: toEmail }],
      subject: 'Movie Discovery - Password Reset',
      htmlContent: `
        <div style="background-color: #000; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%); border: 2px solid #ffd700; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="background-color: #ffd700; padding: 15px; color: #000; font-weight: 900; letter-spacing: 5px; text-transform: uppercase; font-size: 14px;">
              Admit One - Movie Discovery
            </div>
            
            <div style="padding: 40px 20px;">
              <div style="color: #ffd700; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">
                Reset Your Password
              </div>
              <p style="color: #fff; font-size: 14px; margin-bottom: 30px;">
                We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.
              </p>
              <a href="${resetLink}" style="display: inline-block; padding: 15px 30px; background-color: #ffd700; color: #000; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">
                Reset Password
              </a>
              <div style="color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px;">
                Link Valid for 15 Minutes
              </div>
            </div>

            <div style="background-color: #111; padding: 20px; border-top: 1px solid #222;">
              <p style="color: #ffd700; font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                Enjoy the Show
              </p>
            </div>
          </div>
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

const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(404).json({ message: 'User not found' });

    const userId = snapshot.docs[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    await db.collection('users').doc(userId).update({
      resetToken,
      resetTokenExpires,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendResetPasswordEmail(email, resetLink);
      console.log('Password reset email sent successfully via Brevo');
    } catch (emailErr) {
      console.error('Brevo encountered an error during forgot-password:', emailErr.message);
      return res.status(500).json({ message: 'Error sending email' });
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email: rawEmail, token, newPassword } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    const snapshot = await db.collection('users')
      .where('email', '==', email)
      .where('resetToken', '==', token)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.resetTokenExpires < Date.now()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Update password in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      await auth.updateUser(firebaseUser.uid, { password: newPassword });
    } catch (e) {
      return res.status(500).json({ message: 'Error updating authentication record' });
    }

    // Clear reset token in Firestore
    await db.collection('users').doc(userId).update({
      resetToken: admin.firestore.FieldValue.delete(),
      resetTokenExpires: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

