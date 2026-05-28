const { db, admin } = require('../utils/firebase');

// Send a direct message to another user
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    if (!recipientId || !text?.trim()) {
      return res.status(400).json({ message: 'Recipient and text are required' });
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // Conversation ID is always sorted so both users share same doc
    const conversationId = [req.user.id, recipientId].sort().join('_');

    const msgRef = await db.collection('directMessages').add({
      conversationId,
      sender: req.user.id,
      recipient: recipientId,
      text: text.trim(),
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Upsert conversation summary for quick listing
    await db.collection('conversations').doc(conversationId).set({
      participants: [req.user.id, recipientId],
      lastMessage: text.trim(),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSenderId: req.user.id,
      [`unread_${recipientId}`]: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    const msgDoc = await msgRef.get();
    res.json({ _id: msgRef.id, ...msgDoc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between current user and another user
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversationId = [req.user.id, userId].sort().join('_');

    const snapshot = await db.collection('directMessages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();

    const messages = [];
    snapshot.forEach(doc => messages.push({ _id: doc.id, ...doc.data() }));

    // Mark messages as read
    const batch = db.batch();
    snapshot.forEach(doc => {
      if (doc.data().recipient === req.user.id && !doc.data().read) {
        batch.update(doc.ref, { read: true });
      }
    });
    // Reset unread counter
    batch.set(
      db.collection('conversations').doc(conversationId),
      { [`unread_${req.user.id}`]: 0 },
      { merge: true }
    );
    await batch.commit();

    // Fetch other user info
    const otherUserDoc = await db.collection('users').doc(userId).get();
    const otherUser = otherUserDoc.exists
      ? { _id: userId, ...otherUserDoc.data() }
      : null;

    res.json({ messages, otherUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', req.user.id)
      .orderBy('lastMessageAt', 'desc')
      .limit(30)
      .get();

    const conversations = [];
    const otherUserIds = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const otherId = data.participants.find(p => p !== req.user.id);
      conversations.push({ _id: doc.id, ...data, otherId });
      if (otherId) otherUserIds.push(otherId);
    });

    // Fetch user info for all conversation partners
    const usersMap = {};
    for (let i = 0; i < otherUserIds.length; i += 10) {
      const chunk = otherUserIds.slice(i, i + 10);
      const usersSnap = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();
      usersSnap.forEach(doc => {
        const u = doc.data();
        usersMap[doc.id] = {
          _id: doc.id,
          name: u.name,
          characterName: u.characterName,
          profileImage: u.profileImage
        };
      });
    }

    const populated = conversations.map(c => ({
      ...c,
      otherUser: usersMap[c.otherId] || null,
      unreadCount: c[`unread_${req.user.id}`] || 0
    }));

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
