import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePDF,
} from '../controllers/invoices.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:id/pdf', getInvoicePDF);
router.post('/:id/payment', authorize('Admin', 'CIO', 'Accountant'), recordPayment);

router
  .route('/')
  .get(getInvoices)
  .post(authorize('Admin', 'CIO', 'Accountant'), createInvoice);

router
  .route('/:id')
  .get(getInvoice)
  .put(authorize('Admin', 'CIO', 'Accountant'), updateInvoice)
  .delete(authorize('Admin', 'CIO'), deleteInvoice);

export default router;
