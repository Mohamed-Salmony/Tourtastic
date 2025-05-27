const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async (retries = 5) => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB Connected Successfully...');

    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      setTimeout(() => connectDB(retries - 1), 5000);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectDB(retries - 1), 5000);
    });

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after multiple retries');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
