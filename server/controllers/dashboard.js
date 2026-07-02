import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';

// @desc    Get dashboard metrics & chart datasets
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Revenue (Sum of received income)
    const incomes = await Income.find({ status: 'Received' });
    const totalRevenue = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Total Expenses
    const expenses = await Expense.find({});
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses;

    // 4. Pending Collections (Unpaid portions of non-settled invoices)
    const pendingInvoices = await Invoice.find({ status: { $ne: 'Paid' } });
    const pendingPayments = pendingInvoices.reduce((acc, curr) => {
      return acc + (curr.total - curr.amountPaid);
    }, 0);

    // 5. Active Clients Count
    const activeClientsCount = await Client.countDocuments({ status: 'Active' });

    // 6. Timeline charts: Calculate metrics for the past 6 months
    const chartData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Build list of last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const year = d.getFullYear();
      
      const startOfMonth = new Date(year, d.getMonth(), 1);
      const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59);

      // Aggregate income for this month
      const monthlyIncomes = await Income.find({
        status: 'Received',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const monthlyRevenue = monthlyIncomes.reduce((acc, curr) => acc + curr.amount, 0);

      // Aggregate expense for this month
      const monthlyExpenses = await Expense.find({
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const monthlyExpenseVal = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

      chartData.push({
        month: mLabel,
        revenue: monthlyRevenue,
        expense: monthlyExpenseVal,
        profit: monthlyRevenue - monthlyExpenseVal,
      });
    }

    // 7. Fetch 5 most recent transactions (combined)
    const recentIncomes = await Income.find({})
      .populate('clientId', 'name')
      .sort({ date: -1 })
      .limit(5);

    const recentExpenses = await Expense.find({})
      .sort({ date: -1 })
      .limit(5);

    const formattedIncomes = recentIncomes.map((inc) => ({
      _id: inc._id,
      title: inc.title,
      type: 'Income',
      amount: inc.amount,
      date: inc.date,
      category: inc.category,
      details: inc.clientId ? inc.clientId.name : 'Direct Settlement',
      status: inc.status,
    }));

    const formattedExpenses = recentExpenses.map((exp) => ({
      _id: exp._id,
      title: exp.title,
      type: 'Expense',
      amount: exp.amount,
      date: exp.date,
      category: exp.category,
      details: 'Operating Expense',
      status: 'Paid',
    }));

    const recentTransactions = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          pendingPayments,
          activeClients: activeClientsCount,
        },
        chartData,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
