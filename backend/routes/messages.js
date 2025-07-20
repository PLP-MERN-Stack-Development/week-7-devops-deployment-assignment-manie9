const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const router = express.Router();


// @route   GET /api/messages/:roomId
// @desc    Get messages for a room
// @access  Private
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { roomId } = req.params;

    // Check if room exists and user is a member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && room.isPrivate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ room: roomId });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('room')
    .isMongoId()
    .withMessage('Valid room ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, room, replyTo, messageType = 'text' } = req.body;

    // Check if room exists and user is a member
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = roomDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    // Allow all users to send messages in non-private rooms
    if (!isMember && roomDoc.isPrivate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      content,
      sender: req.user._id,
      room,
      messageType,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update room's last activity
    roomDoc.lastActivity = new Date();
    await roomDoc.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username avatar');

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:id/react
// @desc    Add reaction to a message
// @access  Private
router.post('/:id/react', [
  auth,
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(reaction => 
      reaction.user.toString() === req.user._id.toString() && 
      reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(reaction => 
        !(reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();
    await message.populate('reactions.user', 'username');

    res.json({
      message: 'Reaction updated successfully',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;