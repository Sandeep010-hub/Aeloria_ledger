import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projects.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('Admin', 'CIO', 'Accountant'), createProject);

router
  .route('/:id')
  .get(getProject)
  .put(authorize('Admin', 'CIO', 'Accountant'), updateProject)
  .delete(authorize('Admin', 'CIO'), deleteProject);

export default router;
