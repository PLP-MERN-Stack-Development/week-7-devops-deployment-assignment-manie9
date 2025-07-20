const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @route   GET /api/messages/:roomId
// @desc    Get messages for a room
// @access  Private
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Auto-join user to public rooms
    if (!room.isPrivate) {
      const isMember = room.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        room.members.push({
          user: req.user._id,
          role: 'member'
        });
        await room.save();
      }
    } else {
      // Check if user is a member of private room
      const isMember = room.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
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
    .optional()
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

    // Check if room exists
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Auto-join user to public rooms
    if (!roomDoc.isPrivate) {
      const isMember = roomDoc.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        roomDoc.members.push({
          user: req.user._id,
          role: 'member'
        });
        await roomDoc.save();
      }
    } else {
      // Check if user is a member of private room
      const isMember = roomDoc.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const message = new Message({
      content: content || '',
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

// @route   POST /api/messages/upload
// @desc    Upload file and send message
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { room, replyTo } = req.body;

    // Check if room exists and user has access
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Auto-join user to public rooms
    if (!roomDoc.isPrivate) {
      const isMember = roomDoc.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        roomDoc.members.push({
          user: req.user._id,
          role: 'member'
        });
        await roomDoc.save();
      }
    } else {
      // Check if user is a member of private room
      const isMember = roomDoc.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const message = new Message({
      content: `Shared a file: ${req.file.originalname}`,
      sender: req.user._id,
      room,
      messageType: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
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
      message: 'File uploaded and message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Upload file error:', error);
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