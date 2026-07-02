import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a transaction title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a transaction date'],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, 'Please add an income category'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Stripe', 'PayPal', 'Cash', 'Cheque'],
      default: 'Bank Transfer',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Received', 'Pending'],
      default: 'Received',
    },
  },
  {
    timestamps: true,
  }
);

const Income = mongoose.model('Income', IncomeSchema);
export default Income;
