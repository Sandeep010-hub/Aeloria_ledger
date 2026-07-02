import express from 'express';
import {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getQuotationPDF,
} from '../controllers/quotations.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:id/pdf', getQuotationPDF);

router
  .route('/')
  .get(getQuotations)
  .post(authorize('Admin', 'CIO', 'Accountant'), createQuotation);

router
  .route('/:id')
  .get(getQuotation)
  .put(authorize('Admin', 'CIO', 'Accountant'), updateQuotation)
  .delete(authorize('Admin', 'CIO'), deleteQuotation);

export default router;
