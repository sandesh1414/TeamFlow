const Message = require('../models/Message');
const Task = require('../models/Task');
const Team = require('../models/Team');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAndSendNotification } = require('../utils/notificationHelper');
const { askAssistant } = require('../services/aiService');

const chatHandler = (io) => {

  // Authenticate every socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ ${socket.user.name} connected (${socket.id})`);

    // Join personal room for targeted notifications
    socket.join(socket.user._id.toString());

    // Join a team's chat room and load history
    socket.on('join_room', async ({ teamId }) => {
      socket.join(teamId);
      try {
        const messages = await Message.find({ team: teamId })
          .populate('sender', 'name')
          .sort({ createdAt: 1 })
          .limit(50);
        socket.emit('message_history', messages);
      } catch (err) {
        console.error('Error loading message history:', err);
      }
    });

    // Handle sending a message
    socket.on('send_message', async ({ teamId, text, fileUrl, fileType, fileSize, isFile }) => {
      if (!text?.trim()) return;

      try {
        const message = await Message.create({
          team: teamId,
          sender: socket.user._id,
          text: text.trim(),
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          isFile: isFile || false,
        });

        const populatedMessage = await message.populate('sender', 'name');
        io.to(teamId).emit('receive_message', populatedMessage);

        // Handle @mentions (skip @assistant)
        const mentions = text.match(/@(\w+)/g);
        if (mentions) {
          const team = await Team.findById(teamId).populate('members.user', 'name');
          for (const mention of mentions) {
            const mentionedName = mention.slice(1).toLowerCase();
            if (mentionedName === 'assistant') continue; // skip bot mentions
            const matchedMember = team.members.find(
              (m) => m.user.name.toLowerCase() === mentionedName
            );
            if (matchedMember) {
              await createAndSendNotification(io, {
                recipient: matchedMember.user._id,
                sender: socket.user._id,
                type: 'mentioned',
                message: `${socket.user.name} mentioned you in chat: "${text.slice(0, 50)}..."`,
                link: `/team/${teamId}`,
              });
            }
          }
        }

        // Handle @assistant queries
        const isAssistantQuery = text.trim().toLowerCase().startsWith('@assistant');
        if (isAssistantQuery) {
          const question = text.replace(/@assistant/i, '').trim();

          if (!question) {
  // Save to MongoDB first
  const hiMessage = await Message.create({
    team: teamId,
    sender: socket.user._id,
    text: 'Hi! Ask me anything about your tasks. For example: "What tasks are overdue?" or "Who has the most work assigned?"',
    isBot: true,
  });

  // Then emit with the real MongoDB _id
  io.to(teamId).emit('receive_message', {
    _id: hiMessage._id,
    text: hiMessage.text,
    sender: { name: 'Assistant ✨', isBot: true },
    createdAt: hiMessage.createdAt,
    isBot: true,
  });
  return;
}

          const thinkingId = `thinking_${Date.now()}`;
          io.to(teamId).emit('assistant_thinking', { thinkingId });

          try {
            const [tasks, team] = await Promise.all([
              Task.find({ team: teamId })
                .populate('assignedTo', 'name')
                .populate('createdBy', 'name'),
              Team.findById(teamId),
            ]);

            const answer = await askAssistant(question, tasks, team.name);

            const botMessage = await Message.create({
  team: teamId,
  sender: socket.user._id, // use the querying user as sender
  text: answer,
  isBot: true,             // flag it as a bot message
});

// Then emit as before
io.to(teamId).emit('assistant_response', {
  thinkingId,
  message: {
    _id: botMessage._id,   // now has a real MongoDB ID
    text: answer,
    sender: { name: 'Assistant ✨', isBot: true },
    createdAt: botMessage.createdAt,
    isBot: true,
  },
});
          } catch (aiError) {
            console.error('Assistant error:', aiError);
            io.to(teamId).emit('assistant_response', {
              thinkingId,
              message: {
                _id: `bot_error_${Date.now()}`,
                text: 'Sorry, I ran into an issue. Please try again.',
                sender: { name: 'Assistant ✨', isBot: true },
                createdAt: new Date().toISOString(),
                isBot: true,
              },
            });
          }
        }

      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('message_error', 'Failed to send message');
      }
    });

    socket.on('typing', ({ teamId }) => {
      socket.to(teamId).emit('user_typing', { name: socket.user.name });
    });

    socket.on('stop_typing', ({ teamId }) => {
      socket.to(teamId).emit('user_stop_typing', { name: socket.user.name });
    });

    socket.on('disconnect', () => {
      console.log(`❌ ${socket.user.name} disconnected`);
    });
  });
};

module.exports = chatHandler;
