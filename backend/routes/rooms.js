const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all public rooms
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = {
      $or: [
        { isPrivate: false },
        { 'members.user': req.user._id }
      ]
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const rooms = await Room.find(query)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status')
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of private room
    if (room.isPrivate) {
      const isMember = room.members.some(member => 
        member.user._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate, password, maxMembers, tags } = req.body;

    // Check if room name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already exists' });
    }

    const room = new Room({
      name,
      description,
      isPrivate: isPrivate || false,
      password: password || '',
      creator: req.user._id,
      maxMembers: maxMembers || 100,
      tags: tags || [],
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await room.save();
    await room.populate('creator', 'username avatar');
    await room.populate('members.user', 'username avatar status');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms/:id/join
// @desc    Join a room
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already a member
    const isMember = room.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    // Check room capacity
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Check password for private rooms
    if (room.isPrivate && room.password && room.password !== password) {
      return res.status(400).json({ message: 'Invalid room password' });
    }

    // Add user to room
    room.members.push({
      user: req.user._id,
      role: 'member'
    });

    room.lastActivity = new Date();
    await room.save();

    await room.populate('creator', 'username avatar');
    await room.populate('members.user', 'username avatar status');

    res.json({
      message: 'Joined room successfully',
      room
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms/:id/leave
// @desc    Leave a room
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member
    const memberIndex = room.members.findIndex(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'Not a member of this room' });
    }

    // Remove user from room
    room.members.splice(memberIndex, 1);
    room.lastActivity = new Date();
    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;