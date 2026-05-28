const { db, admin } = require('../utils/firebase');
const { uploadImage } = require('../utils/cloudinary');
const { Filter } = require('firebase-admin/firestore');

exports.createDiscussion = async (req, res) => {
  try {
    const { movie, caption, thoughts, image, invitedIds, visibility } = req.body;
    
    let finalImage = image;
    if (image && image.startsWith('data:image')) {
      finalImage = await uploadImage(image, 'discussions');
    }

    const docRef = await db.collection('discussions').add({
      creator: req.user.id,
      movie,
      caption,
      thoughts,
      image: finalImage,
      visibility: visibility || 'private',
      invited: invitedIds || [],
      participants: [req.user.id],
      status: visibility === 'public' ? 'active' : 'draft',
      seenBy: [],
      postCount: 0,
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Invite users
    const batch = db.batch();
    for (const userId of invitedIds) {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        recipient: userId,
        sender: req.user.id,
        type: 'discussion_invite',
        referenceId: docRef.id,
        message: `invited you to discuss ${movie.title}.`,
        read: false,
        resolved: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();

    const doc = await docRef.get();
    res.json({ _id: docRef.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    const docRef = db.collection('discussions').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Discussion not found' });
    const discussion = doc.data();

    if (!discussion.invited.includes(req.user.id)) {
      return res.status(403).json({ message: 'You were not invited to this discussion' });
    }

    let updates = {
      invited: admin.firestore.FieldValue.arrayRemove(req.user.id)
    };

    if (status === 'accepted') {
      updates.participants = admin.firestore.FieldValue.arrayUnion(req.user.id);
      updates.status = 'active';
    }
    
    await docRef.update(updates);

    // Mark invitation notification as read and resolved
    const notifSnapshot = await db.collection('notifications')
      .where('recipient', '==', req.user.id)
      .where('referenceId', '==', id)
      .where('type', '==', 'discussion_invite')
      .get();
      
    if (!notifSnapshot.empty) {
      await db.collection('notifications').doc(notifSnapshot.docs[0].id).update({ read: true, resolved: true });
    }

    const updatedDoc = await docRef.get();
    res.json({ message: `Invite ${status}`, discussion: { _id: id, ...updatedDoc.data() } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('discussions').doc(id).get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Discussion not found' });
    const discussionData = doc.data();

    if (discussionData.visibility !== 'public' && 
        !(discussionData.participants || []).includes(req.user.id) && 
        !(discussionData.invited || []).includes(req.user.id) &&
        discussionData.creator !== req.user.id) {
      return res.status(403).json({ message: 'This discussion is private' });
    }

    // Fetch posts
    const postsSnapshot = await db.collection('discussionPosts')
      .where('discussion', '==', id)
      .orderBy('createdAt', 'asc')
      .get();
      
    const allPosts = [];
    const authorIds = new Set();
    
    postsSnapshot.forEach(postDoc => {
      const pd = postDoc.data();
      allPosts.push({ _id: postDoc.id, ...pd });
      authorIds.add(pd.author);
    });

    // We also need to fetch creator, participants, invited for discussion
    const userIdsToFetch = new Set([
      discussionData.creator, 
      ...(discussionData.participants || []), 
      ...(discussionData.invited || []),
      ...Array.from(authorIds),
      ...(discussionData.seenBy || []).map(s => s.userId)
    ]);

    const usersMap = {};
    if (userIdsToFetch.size > 0) {
      const idsArray = Array.from(userIdsToFetch);
      for (let i = 0; i < idsArray.length; i += 10) {
        const chunk = idsArray.slice(i, i + 10);
        const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
        usersSnapshot.forEach(userDoc => {
          const u = userDoc.data();
          usersMap[userDoc.id] = {
            _id: userDoc.id,
            name: u.name,
            characterName: u.characterName,
            email: u.email,
            profileImage: u.profileImage
          };
        });
      }
    }

    // Populate discussion
    const populatedDiscussion = {
      _id: id,
      ...discussionData,
      creator: usersMap[discussionData.creator] || null,
      participants: (discussionData.participants || []).map(pid => usersMap[pid]).filter(Boolean),
      invited: (discussionData.invited || []).map(pid => usersMap[pid]).filter(Boolean),
      seenBy: (discussionData.seenBy || []).map(s => ({
        ...s,
        userId: usersMap[s.userId] || null
      }))
    };

    // Populate posts
    const populatedPosts = allPosts.map(p => ({
      ...p,
      author: usersMap[p.author] || null
    }));

    res.json({ 
      discussion: populatedDiscussion, 
      posts: populatedPosts, 
      isParticipant: (discussionData.participants || []).includes(req.user.id) 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { discussionId, text, imageUrl, parentPostId } = req.body;
    
    const discussionRef = db.collection('discussions').doc(discussionId);
    const discussionDoc = await discussionRef.get();
    
    if (!discussionDoc.exists) return res.status(404).json({ message: 'Discussion not found' });
    const discussionData = discussionDoc.data();

    if (discussionData.visibility !== 'public' && !discussionData.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only participants can post in this private discussion' });
    }

    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      finalImageUrl = await uploadImage(imageUrl, 'discussions');
    }

    const postRef = await db.collection('discussionPosts').add({
      discussion: discussionId,
      author: req.user.id,
      text,
      imageUrl: finalImageUrl || null,
      parentPostId: parentPostId || null,
      reactions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await discussionRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      postCount: admin.firestore.FieldValue.increment(1)
    });
    
    // Process mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedCharacters = [];
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedCharacters.push(match[1].toLowerCase());
    }
    
    if (mentionedCharacters.length > 0) {
      // Chunk fetch for mentions
      for (let i = 0; i < mentionedCharacters.length; i += 10) {
        const chunk = mentionedCharacters.slice(i, i + 10);
        const usersSnapshot = await db.collection('users').where('characterNameLower', 'in', chunk).get();
        const batch = db.batch();
        usersSnapshot.forEach(mUserDoc => {
          if (mUserDoc.id !== req.user.id) {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
              recipient: mUserDoc.id,
              sender: req.user.id,
              type: 'mention',
              referenceId: discussionId,
              message: `mentioned you in a discussion.`,
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        });
        await batch.commit();
      }
    }

    const postDoc = await postRef.get();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const u = userDoc.data();
    
    const populatedPost = {
      _id: postRef.id,
      ...postDoc.data(),
      author: {
        _id: userDoc.id,
        name: u.name,
        characterName: u.characterName,
        email: u.email,
        profileImage: u.profileImage
      }
    };

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const { postId, emoji } = req.body;
    
    const result = await db.runTransaction(async (t) => {
      const postRef = db.collection('discussionPosts').doc(postId);
      const postDoc = await t.get(postRef);
      if (!postDoc.exists) throw new Error('Post not found');
      
      const postData = postDoc.data();
      const reactions = postData.reactions || [];
      const existingReactionIndex = reactions.findIndex(r => r.userId === req.user.id && r.emoji === emoji);
      
      let newReactions = [...reactions];
      if (existingReactionIndex > -1) {
        newReactions.splice(existingReactionIndex, 1);
      } else {
        newReactions.push({ userId: req.user.id, emoji });
      }
      
      t.update(postRef, { reactions: newReactions });
      return newReactions;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDiscussions = async (req, res) => {
  try {
    const snapshot = await db.collection('discussions')
      .where('status', '==', 'active')
      .where(Filter.or(
        Filter.where('creator', '==', req.user.id),
        Filter.where('participants', 'array-contains', req.user.id)
      ))
      .orderBy('createdAt', 'desc')
      .get();

    const discussions = [];
    snapshot.forEach(doc => discussions.push({ _id: doc.id, ...doc.data() }));

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('discussions').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Discussion not found' });

    await docRef.update({
      participants: admin.firestore.FieldValue.arrayRemove(req.user.id)
    });
    
    res.json({ message: 'Left discussion successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('discussions').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Discussion not found' });

    if (doc.data().creator !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this discussion' });
    }

    // Delete posts too
    const postsSnapshot = await db.collection('discussionPosts').where('discussion', '==', id).get();
    const batch = db.batch();
    postsSnapshot.forEach(postDoc => batch.delete(postDoc.ref));
    batch.delete(docRef);
    await batch.commit();

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.seenDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.runTransaction(async (t) => {
      const docRef = db.collection('discussions').doc(id);
      const doc = await t.get(docRef);
      if (!doc.exists) throw new Error('Discussion not found');
      
      const data = doc.data();
      const seenBy = data.seenBy || [];
      const seenIndex = seenBy.findIndex(s => s.userId === req.user.id);
      
      let newSeenBy = [...seenBy];
      if (seenIndex > -1) {
        newSeenBy[seenIndex].seenAt = new Date().toISOString();
      } else {
        newSeenBy.push({ userId: req.user.id, seenAt: new Date().toISOString() });
      }
      
      t.update(docRef, { seenBy: newSeenBy });
    });
    
    res.json({ message: 'Seen updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hacker-News-style trending score with time decay
function computeTrendingScore(data) {
  const now = Date.now();
  const createdAt = data.createdAt?._seconds ? data.createdAt._seconds * 1000 : now;
  const lastActivity = data.lastActivityAt?._seconds ? data.lastActivityAt._seconds * 1000 : createdAt;
  const hoursOld = Math.max((now - createdAt) / (1000 * 60 * 60), 0.5);
  const hoursSinceActivity = Math.max((now - lastActivity) / (1000 * 60 * 60), 0.1);
  const postCount = data.postCount || 0;
  const participantCount = (data.participants || []).length;
  // Recency bonus: more recent activity = higher score
  const activityScore = (postCount * 3 + participantCount * 2) / Math.pow(hoursOld + 2, 1.5);
  const recencyBonus = 100 / Math.pow(hoursSinceActivity + 1, 0.8);
  return activityScore + recencyBonus;
}

exports.getPublicDiscussions = async (req, res) => {
  try {
    const snapshot = await db.collection('discussions')
      .where('visibility', '==', 'public')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const discussions = [];
    snapshot.forEach(doc => discussions.push({ _id: doc.id, ...doc.data() }));
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrendingRooms = async (req, res) => {
  try {
    const snapshot = await db.collection('discussions')
      .where('visibility', '==', 'public')
      .where('status', '==', 'active')
      .orderBy('lastActivityAt', 'desc')
      .limit(50)
      .get();

    const discussions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const score = computeTrendingScore(data);
      discussions.push({ _id: doc.id, ...data, trendingScore: score });
    });

    discussions.sort((a, b) => b.trendingScore - a.trendingScore);
    res.json(discussions.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchRoomsByMovie = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const query = q.trim().toLowerCase();

    const snapshot = await db.collection('discussions')
      .where('visibility', '==', 'public')
      .where('status', '==', 'active')
      .get();

    const discussions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.movie?.title || '').toLowerCase();
      if (title.includes(query)) {
        const score = computeTrendingScore(data);
        discussions.push({ _id: doc.id, ...data, trendingScore: score });
      }
    });

    discussions.sort((a, b) => b.trendingScore - a.trendingScore);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
