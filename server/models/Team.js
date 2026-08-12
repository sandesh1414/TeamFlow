const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 6).toUpperCase(),
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'member'], default: 'member' },
      },
    ],
  },
  { timestamps: true }
);

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
