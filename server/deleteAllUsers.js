require('dotenv').config();
const { db, auth } = require('./utils/firebase');
const { usersIndex } = require('./utils/algolia');

async function deleteAllUsers() {
  try {
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firestore.');
    } else {
      const batch = db.batch();
      usersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Deleted ${usersSnapshot.size} users from Firestore.`);
    }

    console.log('Fetching users from Firebase Auth...');
    let nextPageToken;
    let authUserCount = 0;
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map(userRecord => userRecord.uid);
      if (uids.length > 0) {
        await auth.deleteUsers(uids);
        authUserCount += uids.length;
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    console.log(`Deleted ${authUserCount} users from Firebase Auth.`);

    if (usersIndex) {
      console.log('Clearing Algolia users index...');
      await usersIndex.clearObjects();
      console.log('Algolia users index cleared.');
    }

    console.log('All users deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

deleteAllUsers();
