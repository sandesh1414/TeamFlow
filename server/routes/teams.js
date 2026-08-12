const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

// POST /api/teams/create
router.post('/create', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Team name is required' });
if (name.trim().length < 2) return res.status(400).json({ message: 'Team name must be at least 2 characters' });
if (name.trim().length > 50) return res.status(400).json({ message: 'Team name must be under 50 characters' });

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
    if (!inviteCode?.trim()) return res.status(400).json({ message: 'Invite code is required' });
if (inviteCode.trim().length !== 6) return res.status(400).json({ message: 'Invite code must be 6 characters' });
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
// PUT /api/teams/:id - Update team details
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Security check: ensure the requesting user is the owner of the team
    const member = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ message: 'Only team owners can edit this workspace' });
    }

    // Update fields
    team.name = name || team.name;
    team.description = description !== undefined ? description : team.description;

    const updatedTeam = await team.save();
    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
