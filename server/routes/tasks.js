const express = require('express');
const Task = require('../models/Task');
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');
const { createAndSendNotification } = require('../utils/notificationHelper');

// Exported as a function that accepts io so we can send real-time notifications
const createRouter = (io) => {
  const router = express.Router();

  const isMember = (team, userId) =>
    team.members.some((m) => m.user.toString() === userId.toString());
  const isOwner = (team, userId) =>
  team.members.some((m) => m.user.toString() === userId.toString() && m.role === 'owner');

  // GET /api/tasks/:teamId
  router.get('/:teamId', protect, async (req, res) => {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
      if (!isMember(team, req.user._id))
        return res.status(403).json({ message: 'Not a member of this team' });

      const tasks = await Task.find({ team: req.params.teamId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('comments.author', 'name')
        .populate('attachments.uploadedBy', 'name')
        .sort({ createdAt: -1 });

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/tasks/:teamId
  router.post('/:teamId', protect, async (req, res) => {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
if (!isOwner(team, req.user._id))
  return res.status(403).json({ message: 'Only the team owner can create tasks' });

      const { title, description, assignedTo, dueDate, priority } = req.body;
if (!title?.trim()) return res.status(400).json({ message: 'Task title is required' });
if (title.trim().length < 2) return res.status(400).json({ message: 'Title must be at least 2 characters' });
if (title.trim().length > 100) return res.status(400).json({ message: 'Title must be under 100 characters' });
if (description && description.length > 1000) return res.status(400).json({ message: 'Description must be under 1000 characters' });

      const task = await Task.create({
        title,
        description,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        priority: priority || 'medium',
        team: req.params.teamId,
        createdBy: req.user._id,
        status: 'todo',
      });

      const populatedTask = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
      ]);
      io.to(req.params.teamId).emit('task_created', populatedTask);

      // Notify assigned user
      if (assignedTo && assignedTo !== req.user._id.toString()) {
        await createAndSendNotification(io, {
          recipient: assignedTo,
          sender: req.user._id,
          type: 'task_assigned',
          message: `${req.user.name} assigned you a task: "${title}"`,
          link: `/team/${req.params.teamId}`,
        });
      }

      res.status(201).json(populatedTask);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // PUT /api/tasks/:taskId
  router.put('/:taskId', protect, async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const team = await Team.findById(task.team);
      if (!isMember(team, req.user._id))
        return res.status(403).json({ message: 'Not a member of this team' });

      const allowedUpdates = ['title', 'description', 'status', 'assignedTo', 'dueDate', 'priority'];
      // Add this BEFORE the allowedUpdates loop:
if (req.body.assignedTo !== undefined && !isOwner(team, req.user._id)) {
  return res.status(403).json({ message: 'Only the team owner can assign tasks' });
}
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      await task.save();

      const updatedTask = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
        { path: 'comments.author', select: 'name' },
        { path: 'attachments.uploadedBy', select: 'name' },
      ]);
io.to(task.team.toString()).emit('task_updated', updatedTask);

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/tasks/:taskId
 router.delete('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const team = await Team.findById(task.team);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (!isOwner(team, req.user._id)) {
      return res.status(403).json({
        message: 'Only the team owner can delete tasks',
      });
    }

    await task.deleteOne();
    io.to(task.team.toString()).emit('task_deleted', {
    taskId: task._id,
});

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

  // POST /api/tasks/:taskId/comment
  router.post('/:taskId/comment', protect, async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const { text } = req.body;
      if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
if (text.trim().length > 500) return res.status(400).json({ message: 'Comment must be under 500 characters' });
      task.comments.push({ text, author: req.user._id });
      await task.save();

      const updatedTask = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
        { path: 'comments.author', select: 'name' },
        { path: 'attachments.uploadedBy', select: 'name' },
      ]);

      // Notify task owner if someone else commented
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        await createAndSendNotification(io, {
          recipient: task.assignedTo,
          sender: req.user._id,
          type: 'task_commented',
          message: `${req.user.name} commented on your task: "${task.title}"`,
          link: `/team/${task.team}`,
        });
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/tasks/:taskId/attach
  router.post('/:taskId/attach', protect, async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const { url, filename, mimetype, size } = req.body;
      task.attachments.push({ url, filename, mimetype, size, uploadedBy: req.user._id });
      await task.save();

      const updatedTask = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
        { path: 'comments.author', select: 'name' },
        { path: 'attachments.uploadedBy', select: 'name' },
      ]);

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};

module.exports = createRouter;
