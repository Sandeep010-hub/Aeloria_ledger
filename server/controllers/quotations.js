import Quotation from '../models/Quotation.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
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

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res, next) => {
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
      query.quotationNumber = { $regex: search, $options: 'i' };
    }

    const quotations = await Quotation.find(query)
      .populate('clientId', 'name companyName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
export const getQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      'clientId',
      'name companyName email phone address gstNumber'
    );
    if (!quotation) {
      res.status(404);
      throw new Error('Quotation not found');
    }
    res.json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private (Admin, CIO, Accountant)
export const createQuotation = async (req, res, next) => {
  try {
    const { clientId, expiryDate, items, gst, discount, status, notes } = req.body;

    // Check client exists
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    // Server-side financial calculations
    const gstPercent = gst || 0;
    const discountAmt = discount || 0;
    const { subtotal, total } = calculateTotals(items, gstPercent, discountAmt);

    // Generate unique Quotation number
    const count = await Quotation.countDocuments({});
    const quotationNumber = `QT-${new Date().getFullYear()}-${(count + 1001).toString()}`;

    const quotation = await Quotation.create({
      quotationNumber,
      clientId,
      expiryDate,
      items,
      subtotal,
      gst: gstPercent,
      discount: discountAmt,
      total,
      status: status || 'Draft',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private (Admin, CIO, Accountant)
export const updateQuotation = async (req, res, next) => {
  try {
    let quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404);
      throw new Error('Quotation not found');
    }

    // Re-calculate finances if items/tax/discounts change
    if (req.body.items) {
      const gstPercent = req.body.gst !== undefined ? req.body.gst : quotation.gst;
      const discountAmt = req.body.discount !== undefined ? req.body.discount : quotation.discount;
      
      const { subtotal, total } = calculateTotals(req.body.items, gstPercent, discountAmt);
      req.body.subtotal = subtotal;
      req.body.total = total;
    } else if (req.body.gst !== undefined || req.body.discount !== undefined) {
      const gstPercent = req.body.gst !== undefined ? req.body.gst : quotation.gst;
      const discountAmt = req.body.discount !== undefined ? req.body.discount : quotation.discount;
      
      const { subtotal, total } = calculateTotals(quotation.items, gstPercent, discountAmt);
      req.body.subtotal = subtotal;
      req.body.total = total;
    }

    quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private (Admin, CIO)
export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404);
      throw new Error('Quotation not found');
    }

    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get PDF file stream
// @route   GET /api/quotations/:id/pdf
// @access  Private
export const getQuotationPDF = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404);
      throw new Error('Quotation not found');
    }

    const client = await Client.findById(quotation.clientId);
    const user = await User.findById(req.user._id);

    // Set Response Headers for Streaming File
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=quotation-${quotation.quotationNumber}.pdf`
    );

    // Invoke PDF service to stream
    generateFinancialPDF(
      quotation,
      client,
      user.companyDetails,
      'quotation',
      res
    );
  } catch (error) {
    next(error);
  }
};
