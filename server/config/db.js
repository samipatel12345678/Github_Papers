/**
 * Database connection setup using Mongoose with resilient fallback mode.
 */

const mongoose = require('mongoose');

let isConnected = false;
let fallbackStore = {
  sessions: new Map(),
  historyEntries: new Map(), // sessionId -> Array of entries
  workspaceFiles: new Map()   // sessionId -> Array of files
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multi_coding_agents';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}.`);
    console.warn(`[Fallback Store] Operating in Resilient In-Memory Mode. Full MERN features remain active!`);
    console.warn(`(To use persistent MongoDB, start your local mongod or set MONGODB_URI in .env)`);
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  type: isConnected ? 'MongoDB (Mongoose)' : 'Resilient In-Memory Store'
});

module.exports = {
  connectDB,
  getDBStatus,
  fallbackStore,
  getIsConnected: () => isConnected
};
