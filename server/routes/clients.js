import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clients.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getClients)
  .post(authorize('Admin', 'CIO', 'Accountant'), createClient);

router
  .route('/:id')
  .get(getClient)
  .put(authorize('Admin', 'CIO', 'Accountant'), updateClient)
  .delete(authorize('Admin', 'CIO'), deleteClient);

export default router;
