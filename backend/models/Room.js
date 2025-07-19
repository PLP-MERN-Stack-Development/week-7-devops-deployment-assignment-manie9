const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [1, 'Room name must be at least 1 character'],
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    }
  }],
  maxMembers: {
    type: Number,
    default: 100,
    min: 2,
    max: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
roomSchema.index({ name: 1 });
roomSchema.index({ creator: 1 });
roomSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Room', roomSchema);