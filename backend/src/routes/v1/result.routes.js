import { Router } from 'express';
import { verifyJWT, restrictTo } from '../../middleware/auth.js';
import {
  submitExam,
  getStudentResults,
  getResultById,
  getAdminResults,
  getDashboardStats,
  getPendingResults,
  approveResult,
  rejectResult
} from '../../controllers/result.controller.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

router.use(verifyJWT);

// Student Result Operations
router.post('/student/:id/submit', restrictTo(ROLES.STUDENT), submitExam);
router.get('/student', restrictTo(ROLES.STUDENT), getStudentResults);

// Admin Analytics Operations
router.get('/admin', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), getAdminResults);
router.get('/admin/dashboard-stats', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), getDashboardStats);
router.get('/admin/pending', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), getPendingResults);
router.post('/admin/review/:id/approve', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), approveResult);
router.post('/admin/review/:id/reject', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), rejectResult);

// Shared Report Operations
router.get('/:id', getResultById);

export default router;
