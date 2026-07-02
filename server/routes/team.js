import express from 'express';
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  deleteTeamMember,
} from '../controllers/team.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTeamMembers)
  .post(authorize('Admin'), addTeamMember);

router
  .route('/:id')
  .put(authorize('Admin'), updateTeamMemberRole)
  .delete(authorize('Admin'), deleteTeamMember);

export default router;
