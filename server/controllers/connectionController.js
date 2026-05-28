const { db, admin } = require('../utils/firebase');
const { Filter } = require('firebase-admin/firestore');

exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.user.id) return res.status(400).json({ message: "You cannot connect with yourself" });

    // Check existing connection
    const snapshot = await db.collection('connections').where(
      Filter.or(
        Filter.and(Filter.where('requester', '==', req.user.id), Filter.where('recipient', '==', recipientId)),
        Filter.and(Filter.where('requester', '==', recipientId), Filter.where('recipient', '==', req.user.id))
      )
    ).get();

    if (!snapshot.empty) return res.status(400).json({ message: "Connection already exists or is pending" });

    const newConnectionRef = await db.collection('connections').add({
      requester: req.user.id,
      recipient: recipientId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification
    await db.collection('notifications').add({
      recipient: recipientId,
      sender: req.user.id,
      type: 'connection_request',
      referenceId: newConnectionRef.id,
      message: `sent you a connection request.`,
      read: false,
      resolved: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newConnectionDoc = await newConnectionRef.get();
    res.json({ message: 'Connection request sent', connection: { _id: newConnectionRef.id, ...newConnectionDoc.data() } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    const connectionRef = db.collection('connections').doc(id);
    const connectionDoc = await connectionRef.get();
    
    if (!connectionDoc.exists) return res.status(404).json({ message: 'Connection not found' });
    const connectionData = connectionDoc.data();

    if (connectionData.status !== 'pending') {
      return res.status(400).json({ message: 'Request already responded to' });
    }

    if (connectionData.recipient !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    await connectionRef.update({ status });

    // If accepted, send notification back to requester
    if (status === 'accepted') {
      await db.collection('notifications').add({
        recipient: connectionData.requester,
        sender: req.user.id,
        type: 'connection_accepted',
        referenceId: id,
        message: `accepted your connection request.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Mark the original request notification as read and resolved
    const notifSnapshot = await db.collection('notifications')
      .where('recipient', '==', req.user.id)
      .where('referenceId', '==', id)
      .where('type', '==', 'connection_request')
      .get();
      
    if (!notifSnapshot.empty) {
      await db.collection('notifications').doc(notifSnapshot.docs[0].id).update({ read: true, resolved: true });
    }

    res.json({ message: `Connection ${status}`, connection: { _id: id, ...connectionData, status } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyConnections = async (req, res) => {
  try {
    const snapshot = await db.collection('connections')
      .where('status', '==', 'accepted')
      .where(
        Filter.or(
          Filter.where('requester', '==', req.user.id),
          Filter.where('recipient', '==', req.user.id)
        )
      ).get();

    const connectedUserIds = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      connectedUserIds.push(data.requester === req.user.id ? data.recipient : data.requester);
    });

    if (connectedUserIds.length === 0) return res.json([]);

    const friends = [];
    // Chunk fetch users
    for (let i = 0; i < connectedUserIds.length; i += 10) {
      const chunk = connectedUserIds.slice(i, i + 10);
      const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
      usersSnapshot.forEach(userDoc => {
        const u = userDoc.data();
        friends.push({
          _id: userDoc.id,
          name: u.name,
          characterName: u.characterName,
          email: u.email,
          profileImage: u.profileImage
        });
      });
    }

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeConnection = async (req, res) => {
  try {
    const friendId = req.params.id; // user id of the connection
    const myId = req.user.id;
    
    const snapshot = await db.collection('connections').where(
      Filter.or(
        Filter.and(Filter.where('requester', '==', myId), Filter.where('recipient', '==', friendId)),
        Filter.and(Filter.where('requester', '==', friendId), Filter.where('recipient', '==', myId))
      )
    ).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    await db.collection('connections').doc(snapshot.docs[0].id).delete();
    
    res.json({ message: 'Connection removed successfully', connectionId: friendId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
