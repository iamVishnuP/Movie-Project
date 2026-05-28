const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.user.id) return res.status(400).json({ message: "You cannot connect with yourself" });

    // Check existing connection
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });

    if (existingConnection) return res.status(400).json({ message: "Connection already exists or is pending" });

    const newConnection = new Connection({ requester: req.user.id, recipient: recipientId, status: 'pending' });
    await newConnection.save();

    // Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: req.user.id,
      type: 'connection_request',
      referenceId: newConnection._id,
      message: `sent you a connection request.`
    });
    await notification.save();

    res.json({ message: 'Connection request sent', connection: newConnection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    const connection = await Connection.findById(id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    connection.status = status;
    await connection.save();

    // If accepted, send notification back to requester
    if (status === 'accepted') {
      const notification = new Notification({
        recipient: connection.requester,
        sender: req.user.id,
        type: 'connection_accepted',
        referenceId: connection._id,
        message: `accepted your connection request.`
      });
      await notification.save();
    }

    // Mark the original request notification as read
    await Notification.findOneAndUpdate(
      { recipient: req.user.id, referenceId: id, type: 'connection_request' },
      { read: true }
    );

    res.json({ message: `Connection ${status}`, connection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: 'accepted'
    }).populate('requester recipient', 'name characterName email');

    const friends = connections.map(conn => {
      return conn.requester._id.toString() === req.user.id ? conn.recipient : conn.requester;
    });

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeConnection = async (req, res) => {
  try {
    const friendId = req.params.id; // user id of the connection
    const myId = req.user.id;
    
    // Find connection document between the two users
    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: friendId },
        { requester: friendId, recipient: myId }
      ]
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    await Connection.findByIdAndDelete(connection._id);
    
    res.json({ message: 'Connection removed successfully', connectionId: friendId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
