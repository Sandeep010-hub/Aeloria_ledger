import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please associate a user'],
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Invoice', 'Quotation', 'Expense', 'System'],
      default: 'System',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
