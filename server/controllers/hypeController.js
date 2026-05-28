const { db, admin } = require('../utils/firebase');

exports.toggleHype = async (req, res) => {
  try {
    const { movieId, title } = req.body;
    const userId = req.user.id;

    // Use a transaction to ensure atomic hype increments
    const result = await db.runTransaction(async (t) => {
      const hypeRef = db.collection('hypes').doc(movieId.toString());
      const doc = await t.get(hypeRef);

      if (!doc.exists) {
        // Create new
        t.set(hypeRef, {
          movieId: movieId.toString(),
          title,
          hypedBy: [userId],
          hypeCount: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { isHyped: true, hypeCount: 1 };
      } else {
        const data = doc.data();
        const index = data.hypedBy.indexOf(userId);
        let newHypedBy = [...data.hypedBy];
        let newHypeCount = data.hypeCount;
        let isHyped = false;

        if (index === -1) {
          newHypedBy.push(userId);
          newHypeCount += 1;
          isHyped = true;
        } else {
          newHypedBy.splice(index, 1);
          newHypeCount -= 1;
          isHyped = false;
        }

        t.update(hypeRef, {
          hypedBy: newHypedBy,
          hypeCount: newHypeCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { isHyped, hypeCount: newHypeCount };
      }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHypeStats = async (req, res) => {
  try {
    const { movieIds } = req.query; // Comma separated IDs
    if (!movieIds) return res.json({});

    const ids = movieIds.split(',').map(id => id.toString());
    const stats = {};
    
    // Chunk fetch
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const snapshot = await db.collection('hypes').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        stats[data.movieId] = {
          hypeCount: data.hypeCount,
          isHyped: req.user && data.hypedBy ? data.hypedBy.includes(req.user.id) : false
        };
      });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllHypes = async (req, res) => {
  try {
    const snapshot = await db.collection('hypes').orderBy('hypeCount', 'desc').get();
    const hypes = [];
    snapshot.forEach(doc => hypes.push({ _id: doc.id, ...doc.data() }));
    res.json(hypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
