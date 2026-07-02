import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please associate a user'],
    },
    role: {
      type: String,
      enum: ['Admin', 'CIO', 'Accountant', 'Viewer'],
      default: 'Viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);
export default TeamMember;
