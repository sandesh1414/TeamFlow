const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    fileUrl: { type: String, default: null },
    fileType: { type: String, default: null },
    fileSize: { type: Number, default: null },
    isFile: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false },  // ← ADD THIS LINE
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
