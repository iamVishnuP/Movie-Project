const { db, admin } = require('../utils/firebase');

exports.getCollections = async (req, res) => {
  try {
    const snapshot = await db.collection('collections')
      .where('user', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();
      
    const collections = [];
    snapshot.forEach(doc => {
      collections.push({ _id: doc.id, ...doc.data() });
    });
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const { name, description, filters } = req.body;
    const docRef = await db.collection('collections').add({
      user: req.user.id,
      name,
      description,
      filters,
      movies: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await docRef.get();
    res.status(201).json({ _id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { movie } = req.body; // { id, title, posterPath }
    
    const docRef = db.collection('collections').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user !== req.user.id) {
      return res.status(404).json({ message: 'Not found' });
    }
    
    const collectionData = doc.data();
    if (!collectionData.movies.some(m => m.id === movie.id.toString())) {
      const newMovie = { id: movie.id.toString(), title: movie.title, posterPath: movie.posterPath };
      await docRef.update({
        movies: admin.firestore.FieldValue.arrayUnion(newMovie)
      });
      collectionData.movies.push(newMovie);
    }
    res.json({ _id: id, ...collectionData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromCollection = async (req, res) => {
  try {
    const { id, movieId } = req.params;
    
    const docRef = db.collection('collections').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user !== req.user.id) {
      return res.status(404).json({ message: 'Not found' });
    }
    
    const collectionData = doc.data();
    const movieToRemove = collectionData.movies.find(m => m.id === movieId.toString());
    
    if (movieToRemove) {
      await docRef.update({
        movies: admin.firestore.FieldValue.arrayRemove(movieToRemove)
      });
      collectionData.movies = collectionData.movies.filter(m => m.id !== movieId.toString());
    }
    
    res.json({ _id: id, ...collectionData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('collections').doc(id);
    const doc = await docRef.get();
    if (doc.exists && doc.data().user === req.user.id) {
      await docRef.delete();
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
