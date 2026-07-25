const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const Team = require('../models/Team');
const { summarizeTask, splitTask, suggestPriority } = require('../services/aiService');

// POST /api/ai/summarize/:taskId
router.post('/summarize/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .populate('comments.author', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const team = await Team.findById(task.team);
    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const summary = await summarizeTask(task);
    res.json({ summary });
  } catch (error) {
    console.error('AI summarize error:', error);
    if (error.message?.includes('API_KEY'))
      return res.status(500).json({ message: 'AI service configuration error' });
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

// POST /api/ai/split/:teamId
router.post('/split/:teamId', protect, async (req, res) => {
  try {
    const { taskTitle } = req.body;
    if (!taskTitle?.trim())
      return res.status(400).json({ message: 'Task title is required' });

    const team = await Team.findById(req.params.teamId).populate('members.user', 'name');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const subtasks = await splitTask(taskTitle, team.members);

    const createdTasks = await Promise.all(
      subtasks.map((subtask) =>
        Task.create({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority || 'medium',
          status: 'todo',
          team: req.params.teamId,
          createdBy: req.user._id,
          assignedTo: null,
        })
      )
    );

    const populatedTasks = await Promise.all(
      createdTasks.map((task) => task.populate('createdBy', 'name'))
    );

    res.status(201).json({
      message: `Created ${populatedTasks.length} subtasks`,
      tasks: populatedTasks,
      aiSuggestions: subtasks,
    });
  } catch (error) {
    console.error('AI split error:', error);
    if (error instanceof SyntaxError)
      return res.status(500).json({ message: 'AI returned invalid format. Please try again.' });
    res.status(500).json({ message: 'Failed to split task' });
  }
});

// POST /api/ai/priority
router.post('/priority', protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || title.trim().length < 5)
      return res.json({ priority: 'medium' });

    const priority = await suggestPriority(title, description);
    res.json({ priority });
  } catch (error) {
    console.error('Priority suggestion error:', error);
    res.json({ priority: 'medium' }); // fail silently
  }
});

module.exports = router;
