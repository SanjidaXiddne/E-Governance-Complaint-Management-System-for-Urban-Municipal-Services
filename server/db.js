/**
 * MongoDB Database Connection Module
 * Handles connection to MongoDB using Mongoose with proper error handling
 */

const mongoose = require("mongoose");

// Get MongoDB URI from environment variable
const uri = process.env.MONGODB_URI;

/**
 * Connect to MongoDB database
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set");
    // In serverless, don't exit process - throw error instead
    if (process.env.VERCEL) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    process.exit(1);
  }

  // Check if already connected (important for serverless/function reuse)
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected, reusing connection");
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      // These options are no longer needed in Mongoose 6+, but included for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Handle connection events (only set once)
    if (!mongoose.connection.listeners("error").length) {
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Attempting to reconnect...");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected");
      });
    }

    return conn;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // In serverless, don't exit process - throw error instead
    if (process.env.VERCEL) {
      throw err;
    }
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise} Disconnect promise
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err.message);
  }
};

module.exports = { connectDB, disconnectDB };
