import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an expense title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Please add an expense date'],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, 'Please add an expense category'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
