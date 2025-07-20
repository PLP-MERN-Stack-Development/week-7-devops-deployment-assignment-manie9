const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const Room = require('./models/Room');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkGeneralRoom() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    const room = await Room.findOne({ name: 'General' });
    if (room) {
      console.log('General room found:', room);
    } else {
      console.log('General room not found in the database.');
    }
  } catch (error) {
    console.error('Error checking general room:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkGeneralRoom();
