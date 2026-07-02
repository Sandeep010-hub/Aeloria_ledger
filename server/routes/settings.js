import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getSettings)
  .put(authorize('Admin', 'CIO'), upload.single('logo'), updateSettings);

export default router;
