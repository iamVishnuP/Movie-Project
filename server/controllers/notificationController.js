const { db, admin } = require('../utils/firebase');

exports.getNotifications = async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('recipient', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) return res.json([]);

    const notifications = [];
    const senderIds = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({ _id: doc.id, ...data });
      if (data.sender) senderIds.add(data.sender);
    });

    // Fetch senders to simulate populate
    const sendersMap = {};
    if (senderIds.size > 0) {
      const senderIdsArray = Array.from(senderIds);
      for (let i = 0; i < senderIdsArray.length; i += 10) {
        const chunk = senderIdsArray.slice(i, i + 10);
        const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
        usersSnapshot.forEach(userDoc => {
          const u = userDoc.data();
          sendersMap[userDoc.id] = {
            _id: userDoc.id,
            name: u.name,
            characterName: u.characterName,
            email: u.email
          };
        });
      }
    }

    const populatedNotifications = notifications.map(n => ({
      ...n,
      sender: sendersMap[n.sender] || null
    }));

    res.json(populatedNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notifRef = db.collection('notifications').doc(id);
    const doc = await notifRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Notification not found' });
    
    if (doc.data().recipient !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notifRef.update({ read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('recipient', '==', req.user.id)
      .where('read', '==', false)
      .get();

    if (snapshot.empty) return res.json({ message: 'All notifications marked as read' });

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
