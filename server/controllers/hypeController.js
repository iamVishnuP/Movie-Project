const Hype = require('../models/Hype');

exports.toggleHype = async (req, res) => {
  try {
    const { movieId, title } = req.body;
    const userId = req.user.id;

    let hype = await Hype.findOne({ movieId });

    if (!hype) {
      hype = new Hype({ movieId, title, hypedBy: [userId], hypeCount: 1 });
    } else {
      const index = hype.hypedBy.indexOf(userId);
      if (index === -1) {
        hype.hypedBy.push(userId);
        hype.hypeCount += 1;
      } else {
        hype.hypedBy.splice(index, 1);
        hype.hypeCount -= 1;
      }
    }

    await hype.save();
    res.json({
      isHyped: hype.hypedBy.includes(userId),
      hypeCount: hype.hypeCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHypeStats = async (req, res) => {
  try {
    const { movieIds } = req.query; // Comma separated IDs
    if (!movieIds) return res.json({});

    const ids = movieIds.split(',');
    const hypes = await Hype.find({ movieId: { $in: ids } });

    const stats = {};
    hypes.forEach(h => {
      stats[h.movieId] = {
        hypeCount: h.hypeCount,
        isHyped: req.user ? h.hypedBy.includes(req.user.id) : false
      };
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllHypes = async (req, res) => {
  try {
    const hypes = await Hype.find().sort('-hypeCount');
    res.json(hypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
