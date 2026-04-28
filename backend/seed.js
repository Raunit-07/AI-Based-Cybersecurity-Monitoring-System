require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatops');
    console.log('MongoDB connected.');

    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists.');
    } else {
      const admin = new User({
        username: 'admin',
        password: 'password', // will be hashed by pre-save hook
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully. (username: admin, password: password)');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
