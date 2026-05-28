const { db, admin } = require('../utils/firebase');
const { usersIndex } = require('../utils/algolia');
const { Filter } = require('firebase-admin/firestore');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    
    // Search using Algolia
    const { hits } = await usersIndex.search(cleanQuery, {
      filters: `NOT objectID:${req.user.id}`
    });

    // Map Algolia hits to the expected user format (excluding sensitive fields)
    const users = hits.map(hit => ({
      _id: hit.objectID, // keeping _id for frontend compatibility
      name: hit.name,
      characterName: hit.characterName,
      email: hit.email,
      profileImage: hit.profileImage,
      favoriteMovies: hit.favoriteMovies,
      favoriteDirectors: hit.favoriteDirectors,
      selectedGenres: hit.selectedGenres,
      selectedLanguages: hit.selectedLanguages
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch user from Firestore
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    
    const userData = userDoc.data();
    // Exclude sensitive info
    delete userData.password;
    delete userData.otp;
    delete userData.otpExpires;
    
    // Add _id for frontend compatibility
    const user = { _id: id, ...userData };

    // Get connection status with current user
    const connectionSnapshot = await db.collection('connections')
      .where(
        Filter.or(
          Filter.and(Filter.where('requester', '==', req.user.id), Filter.where('recipient', '==', id)),
          Filter.and(Filter.where('requester', '==', id), Filter.where('recipient', '==', req.user.id))
        )
      ).get();

    let connectionStatus = 'none';
    let isRequester = false;
    let connectionId = null;

    if (!connectionSnapshot.empty) {
      const connDoc = connectionSnapshot.docs[0];
      const connData = connDoc.data();
      connectionStatus = connData.status;
      isRequester = connData.requester === req.user.id;
      connectionId = connDoc.id;
    }

    // Get discussion count
    const discussionSnapshot = await db.collection('discussions')
      .where('participants', 'array-contains', id)
      .where('status', '==', 'active')
      .count()
      .get();
    
    const discussionCount = discussionSnapshot.data().count;

    // Get connection count
    const connectionCountSnapshot = await db.collection('connections')
      .where('status', '==', 'accepted')
      .where(Filter.or(
        Filter.where('requester', '==', id),
        Filter.where('recipient', '==', id)
      ))
      .count()
      .get();

    const connectionCount = connectionCountSnapshot.data().count;

    res.json({
      user,
      connectionStatus,
      isRequester,
      connectionId,
      stats: {
        discussions: discussionCount,
        connections: connectionCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserConnections = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connectionsSnapshot = await db.collection('connections')
      .where('status', '==', 'accepted')
      .where(Filter.or(
        Filter.where('requester', '==', id),
        Filter.where('recipient', '==', id)
      )).get();

    const connectedUserIds = [];
    const connectionDataList = [];

    connectionsSnapshot.forEach(doc => {
      const data = doc.data();
      const connectedUserId = data.requester === id ? data.recipient : data.requester;
      connectedUserIds.push(connectedUserId);
      connectionDataList.push({ id: doc.id, connectedUserId });
    });

    if (connectedUserIds.length === 0) {
      return res.json([]);
    }

    // Since Firestore doesn't have populate, we must fetch the users
    // Because 'in' query supports max 10, we'll chunk it or fetch individually if it's small
    // For safety, let's fetch in chunks of 10
    const connectedUsers = [];
    
    for (let i = 0; i < connectedUserIds.length; i += 10) {
      const chunk = connectedUserIds.slice(i, i + 10);
      const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
      
      usersSnapshot.forEach(userDoc => {
        const u = userDoc.data();
        connectedUsers.push({
          _id: userDoc.id,
          name: u.name,
          characterName: u.characterName,
          email: u.email,
          profileImage: u.profileImage
        });
      });
    }

    res.json(connectedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
