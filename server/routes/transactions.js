import express from 'express';
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCombinedTransactions,
} from '../controllers/transactions.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

// Combined Transaction Log
router.get('/', getCombinedTransactions);

// Income CRUD Routes
router
  .route('/income')
  .get(getIncomes)
  .post(authorize('Admin', 'CIO', 'Accountant'), createIncome);

router
  .route('/income/:id')
  .put(authorize('Admin', 'CIO', 'Accountant'), updateIncome)
  .delete(authorize('Admin', 'CIO'), deleteIncome);

// Expense CRUD Routes
router
  .route('/expenses')
  .get(getExpenses)
  .post(
    authorize('Admin', 'CIO', 'Accountant'),
    upload.single('receipt'),
    createExpense
  );

router
  .route('/expenses/:id')
  .put(
    authorize('Admin', 'CIO', 'Accountant'),
    upload.single('receipt'),
    updateExpense
  )
  .delete(authorize('Admin', 'CIO'), deleteExpense);

export default router;
