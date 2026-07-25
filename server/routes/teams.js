const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

// POST /api/teams/create
router.post('/create', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.create({
      name,
      description,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/teams/join
router.post('/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) return res.status(404).json({ message: 'Invalid invite code' });

    const alreadyMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'You are already in this team' });

    team.members.push({ user: req.user._id, role: 'member' });
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teams/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const teams = await Team.find({
      members: { $elemMatch: { user: req.user._id } },
    }).populate('members.user', 'name email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
