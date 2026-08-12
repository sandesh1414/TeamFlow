const Notification = require('../models/Notification');

const createAndSendNotification = async (io, { recipient, sender, type, message, link }) => {
  try {
    // Don't notify yourself
    if (recipient.toString() === sender.toString()) return;

    const notification = await Notification.create({ recipient, sender, type, message, link });
    const populated = await notification.populate('sender', 'name');

    // Emit to the recipient's personal socket room (named after their userId)
    io.to(recipient.toString()).emit('new_notification', populated);
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = { createAndSendNotification };
