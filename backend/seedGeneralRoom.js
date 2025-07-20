const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');
require('dotenv').config();

const createGeneralRoom = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if general room already exists
    const existingRoom = await Room.findOne({ isGeneral: true });
    if (existingRoom) {
      console.log('General room already exists');
      return;
    }

    // Create a system user if it doesn't exist
    let systemUser = await User.findOne({ email: 'system@chatapp.com' });
    if (!systemUser) {
      systemUser = new User({
        username: 'System',
        email: 'system@chatapp.com',
        password: 'system123456' // This will be hashed automatically
      });
      await systemUser.save();
    }

    // Create general room
    const generalRoom = new Room({
      name: 'General',
      description: 'Welcome to the general chat room! This is where everyone can chat together.',
      isPrivate: false,
      creator: systemUser._id,
      isGeneral: true,
      maxMembers: 1000,
      members: [{
        user: systemUser._id,
        role: 'admin'
      }]
    });

    await generalRoom.save();
    console.log('General room created successfully');

    // Add all existing users to the general room
    const allUsers = await User.find({ _id: { $ne: systemUser._id } });
    for (const user of allUsers) {
      if (!generalRoom.members.some(member => member.user.toString() === user._id.toString())) {
        generalRoom.members.push({
          user: user._id,
          role: 'member'
        });
      }
    }
    await generalRoom.save();
    console.log(`Added ${allUsers.length} users to general room`);

  } catch (error) {
    console.error('Error creating general room:', error);
  } finally {
    await mongoose.connection.close();
  }
};

createGeneralRoom();