const Collection = require('../models/Collection');

exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id }).sort('-createdAt');
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const { name, description, filters } = req.body;
    const collection = new Collection({
      user: req.user.id,
      name,
      description,
      filters
    });
    await collection.save();
    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { movie } = req.body; // { id, title, posterPath }
    const collection = await Collection.findOne({ _id: id, user: req.user.id });
    if (!collection) return res.status(404).json({ message: 'Not found' });
    
    if (!collection.movies.some(m => m.id === movie.id.toString())) {
      collection.movies.push({ id: movie.id.toString(), title: movie.title, posterPath: movie.posterPath });
      await collection.save();
    }
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromCollection = async (req, res) => {
  try {
    const { id, movieId } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user.id });
    if (!collection) return res.status(404).json({ message: 'Not found' });
    
    collection.movies = collection.movies.filter(m => m.id !== movieId);
    await collection.save();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    await Collection.findOneAndDelete({ _id: id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
