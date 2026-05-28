const User = require('../models/User');
const Connection = require('../models/Connection');
const Discussion = require('../models/Discussion');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    // Normalize query by stripping leading @ and perform case-insensitive search
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const users = await User.find({
      characterName: { $regex: cleanQuery, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('name characterName email profileImage favoriteMovies favoriteDirectors selectedGenres selectedLanguages');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get connection status with current user
    const connection = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: id },
        { requester: id, recipient: req.user.id }
      ]
    });

    // Get discussion count
    const discussionCount = await Discussion.countDocuments({
      participants: id,
      status: 'active'
    });

    // Get connection count
    const connectionCount = await Connection.countDocuments({
      $or: [{ requester: id }, { recipient: id }],
      status: 'accepted'
    });

    res.json({
      user,
      connectionStatus: connection ? connection.status : 'none',
      isRequester: connection ? connection.requester.toString() === req.user.id : false,
      connectionId: connection ? connection._id : null,
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
    const connections = await Connection.find({
      $or: [{ requester: id }, { recipient: id }],
      status: 'accepted'
    }).populate('requester recipient', 'name characterName email profileImage');

    const connectedUsers = connections.map(conn => {
      return conn.requester._id.toString() === id ? conn.recipient : conn.requester;
    });

    res.json(connectedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
