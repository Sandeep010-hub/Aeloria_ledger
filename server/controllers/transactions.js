import Income from '../models/Income.js';
import Expense from '../models/Expense.js';

// ==========================================
// INCOME CONTROLLERS
// ==========================================

// @desc    Get all incomes
// @route   GET /api/income
// @access  Private
export const getIncomes = async (req, res, next) => {
  try {
    const { search, category, paymentMethod, clientId } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (clientId) {
      query.clientId = clientId;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const incomes = await Income.find(query)
      .populate('clientId', 'name companyName')
      .sort({ date: -1 });

    res.json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    next(error);
  }
};

// @desc    Create income record
// @route   POST /api/income
// @access  Private (Admin, CIO, Accountant)
export const createIncome = async (req, res, next) => {
  try {
    const { title, amount, date, category, paymentMethod, clientId, notes, status } = req.body;

    const income = await Income.create({
      title,
      amount,
      date: date || new Date(),
      category,
      paymentMethod,
      clientId: clientId || null,
      notes: notes || '',
      status: status || 'Received',
    });

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

// @desc    Update income record
// @route   PUT /api/income/:id
// @access  Private (Admin, CIO, Accountant)
export const updateIncome = async (req, res, next) => {
  try {
    let income = await Income.findById(req.params.id);
    if (!income) {
      res.status(404);
      throw new Error('Income record not found');
    }

    income = await Income.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete income record
// @route   DELETE /api/income/:id
// @access  Private (Admin, CIO)
export const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      res.status(404);
      throw new Error('Income record not found');
    }

    await Income.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Income record deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPENSE CONTROLLERS
// ==========================================

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const { search, category, paymentMethod } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create expense record
// @route   POST /api/expenses
// @access  Private (Admin, CIO, Accountant)
export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, date, category, paymentMethod, notes } = req.body;
    let receiptUrl = '';

    // If file uploaded (via Multer), capture it
    if (req.file) {
      receiptUrl = req.file.path || req.file.secure_url || '';
    }

    const expense = await Expense.create({
      title,
      amount,
      date: date || new Date(),
      category,
      paymentMethod: paymentMethod || 'Cash',
      receiptUrl,
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense record
// @route   PUT /api/expenses/:id
// @access  Private (Admin, CIO, Accountant)
export const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error('Expense record not found');
    }

    if (req.file) {
      req.body.receiptUrl = req.file.path || req.file.secure_url || '';
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense record
// @route   DELETE /api/expenses/:id
// @access  Private (Admin, CIO)
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error('Expense record not found');
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expense record deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COMBINED TRANSACTIONS LOGS FOR DASHBOARD
// ==========================================

// @desc    Get aggregate transaction history (Income & Expenses combined)
// @route   GET /api/transactions
// @access  Private
export const getCombinedTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const incomes = await Income.find({})
      .populate('clientId', 'name companyName')
      .sort({ date: -1 })
      .limit(limit);

    const expenses = await Expense.find({})
      .sort({ date: -1 })
      .limit(limit);

    // Format incomes and expenses with tags so client side can format distinct badges
    const formattedIncomes = incomes.map((inc) => ({
      _id: inc._id,
      title: inc.title,
      type: 'Income',
      amount: inc.amount,
      date: inc.date,
      category: inc.category,
      paymentMethod: inc.paymentMethod,
      details: inc.clientId ? inc.clientId.name : 'Direct Payment',
      status: inc.status,
    }));

    const formattedExpenses = expenses.map((exp) => ({
      _id: exp._id,
      title: exp.title,
      type: 'Expense',
      amount: exp.amount,
      date: exp.date,
      category: exp.category,
      paymentMethod: exp.paymentMethod,
      details: exp.notes || 'Operating expense',
      status: 'Paid',
    }));

    const combined = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json({ success: true, data: combined });
  } catch (error) {
    next(error);
  }
};
