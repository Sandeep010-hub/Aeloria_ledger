import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import Income from '../models/Income.js';
import { generateFinancialPDF } from '../services/pdfService.js';

// Helper to compute subtotal and total
const calculateTotals = (items, gstPercent, discountAmt) => {
  const subtotal = items.reduce((acc, item) => {
    item.amount = item.quantity * item.rate;
    return acc + item.amount;
  }, 0);

  const gstAmount = subtotal * (gstPercent / 100);
  const total = subtotal + gstAmount - discountAmt;

  return { subtotal, total };
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
  try {
    const { search, status, clientId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (clientId) {
      query.clientId = clientId;
    }
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name companyName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'clientId',
      'name companyName email phone address gstNumber'
    );
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Admin, CIO, Accountant)
export const createInvoice = async (req, res, next) => {
  try {
    const { clientId, quotationId, dueDate, items, gst, discount, status, notes } = req.body;

    // Check client exists
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Server-side calculations
    const gstPercent = gst || 0;
    const discountAmt = discount || 0;
    const { subtotal, total } = calculateTotals(items, gstPercent, discountAmt);

    // Generate unique Invoice number
    const count = await Invoice.countDocuments({});
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1001).toString()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      clientId,
      quotationId: quotationId || null,
      dueDate,
      items,
      subtotal,
      gst: gstPercent,
      discount: discountAmt,
      total,
      status: status || 'Pending',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private (Admin, CIO, Accountant)
export const updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    // Re-calculate totals if items change
    if (req.body.items) {
      const gstPercent = req.body.gst !== undefined ? req.body.gst : invoice.gst;
      const discountAmt = req.body.discount !== undefined ? req.body.discount : invoice.discount;
      
      const { subtotal, total } = calculateTotals(req.body.items, gstPercent, discountAmt);
      req.body.subtotal = subtotal;
      req.body.total = total;
    } else if (req.body.gst !== undefined || req.body.discount !== undefined) {
      const gstPercent = req.body.gst !== undefined ? req.body.gst : invoice.gst;
      const discountAmt = req.body.discount !== undefined ? req.body.discount : invoice.discount;
      
      const { subtotal, total } = calculateTotals(invoice.items, gstPercent, discountAmt);
      req.body.subtotal = subtotal;
      req.body.total = total;
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin, CIO)
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Record client payment on invoice
// @route   POST /api/invoices/:id/payment
// @access  Private (Admin, CIO, Accountant)
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, date, notes } = req.body;
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400);
      throw new Error('Please provide a valid positive payment amount');
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    // Update payments
    const newPaidAmount = invoice.amountPaid + paymentAmount;
    invoice.amountPaid = newPaidAmount;

    // Resolve Status
    if (newPaidAmount >= invoice.total) {
      invoice.status = 'Paid';
    } else if (newPaidAmount > 0) {
      invoice.status = 'Partial';
    } else {
      invoice.status = 'Pending';
    }

    await invoice.save();

    // Log the transaction in Income Ledger automatically!
    await Income.create({
      title: `Invoice Payment: ${invoice.invoiceNumber}`,
      amount: paymentAmount,
      date: date || new Date(),
      category: 'Invoice Settlement',
      paymentMethod: paymentMethod || 'Bank Transfer',
      clientId: invoice.clientId,
      notes: notes || `Direct invoice settlement for ${invoice.invoiceNumber}`,
      status: 'Received',
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get PDF file stream
// @route   GET /api/invoices/:id/pdf
// @access  Private
export const getInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    const client = await Client.findById(invoice.clientId);
    const user = await User.findById(req.user._id);

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
    );

    // Invoke PDF service to stream
    generateFinancialPDF(
      invoice,
      client,
      user.companyDetails,
      'invoice',
      res
    );
  } catch (error) {
    next(error);
  }
};
