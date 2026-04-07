const Discussion = require('../models/Discussion');
const DiscussionPost = require('../models/DiscussionPost');
const Notification = require('../models/Notification');
const Connection = require('../models/Connection');

exports.createDiscussion = async (req, res) => {
  try {
    const { movie, caption, thoughts, image, invitedIds } = req.body;
    
    const newDiscussion = new Discussion({
      creator: req.user.id,
      movie,
      caption,
      thoughts,
      image,
      invited: invitedIds,
      participants: [req.user.id],
      status: 'draft' // status becomes 'active' after first invitee accepts
    });
    
    await newDiscussion.save();

    // Invite users
    for (const userId of invitedIds) {
      const notification = new Notification({
        recipient: userId,
        sender: req.user.id,
        type: 'discussion_invite',
        referenceId: newDiscussion._id,
        message: `invited you to discuss ${movie.title}.`
      });
      await notification.save();
    }

    res.json(newDiscussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    const discussion = await Discussion.findById(id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    if (!discussion.invited.includes(req.user.id)) {
      return res.status(403).json({ message: 'You were not invited to this discussion' });
    }

    if (status === 'accepted') {
      discussion.participants.push(req.user.id);
      discussion.status = 'active'; // First acceptance activates it
    }
    
    // Remove from invited regardless
    discussion.invited = discussion.invited.filter(uid => uid.toString() !== req.user.id);
    await discussion.save();

    // Mark invitation notification as read
    await Notification.findOneAndUpdate(
      { recipient: req.user.id, referenceId: id, type: 'discussion_invite' },
      { read: true }
    );

    res.json({ message: `Invite ${status}`, discussion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await Discussion.findById(id)
      .populate('creator participants invited', 'name characterName email profileImage');
    
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    // Fetch related posts
    const posts = await DiscussionPost.find({ discussion: id, parentPostId: null })
      .populate('author', 'name characterName email profileImage')
      .sort({ createdAt: 1 });

    // For simplicity, we fetch child posts and map them later or client-side
    // Let's bundle them for now
    const allPosts = await DiscussionPost.find({ discussion: id })
      .populate('author', 'name characterName email profileImage')
      .sort({ createdAt: 1 });

    res.json({ discussion, posts: allPosts, isParticipant: discussion.participants.some(p => p._id.toString() === req.user.id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { discussionId, text, imageUrl, parentPostId } = req.body;
    
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    if (!discussion.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Only participants can post in this discussion' });
    }

    const post = new DiscussionPost({
      discussion: discussionId,
      author: req.user.id,
      text,
      imageUrl,
      parentPostId: parentPostId || null
    });

    await post.save();
    
    // Touch discussion to update its updatedAt timestamp for unread tracking
    discussion.updatedAt = new Date();
    await discussion.save();
    
    const populatedPost = await DiscussionPost.findById(post._id).populate('author', 'name characterName email profileImage');

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const { postId, emoji } = req.body;
    const post = await DiscussionPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if user already reacted with this emoji
    const existingReaction = post.reactions.find(r => r.userId.toString() === req.user.id && r.emoji === emoji);
    
    if (existingReaction) {
      // Remove reaction
      post.reactions = post.reactions.filter(r => !(r.userId.toString() === req.user.id && r.emoji === emoji));
    } else {
      // Add reaction
      post.reactions.push({ userId: req.user.id, emoji });
    }

    await post.save();
    res.json(post.reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({
      $or: [{ creator: req.user.id }, { participants: req.user.id }],
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await Discussion.findById(id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    // Remove from participants
    discussion.participants = discussion.participants.filter(p => p.toString() !== req.user.id);
    
    // If no participants left, or if creator leaves and you want to close it, 
    // you could handle that here. For now, just leave.
    
    await discussion.save();
    res.json({ message: 'Left discussion successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await Discussion.findById(id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    if (discussion.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this discussion' });
    }

    // Delete posts too
    await DiscussionPost.deleteMany({ discussion: id });
    await Discussion.findByIdAndDelete(id);

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
