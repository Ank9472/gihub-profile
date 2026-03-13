const mongoose = require('mongoose');

let databaseConnected = false;

const connectDatabase = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    databaseConnected = true;
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      databaseConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      databaseConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      databaseConnected = true;
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    databaseConnected = false;
    return null;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    databaseConnected = false;
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
};

const isDatabaseConnected = () => databaseConnected;

module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
