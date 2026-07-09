import { Router } from 'express';
import { verifyJWT, restrictTo } from '../../middleware/auth.js';
import {
  createExam,
  getAdminExams,
  getExamById,
  updateExam,
  deleteExam,
  duplicateExam,
  getStudentExams,
  startExam,
  saveAnswer,
  logViolation
} from '../../controllers/exam.controller.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

router.use(verifyJWT);

// Student Exam Routes
router.get('/student', restrictTo(ROLES.STUDENT), getStudentExams);
router.get('/student/:id/start', restrictTo(ROLES.STUDENT), startExam);
router.post('/student/:id/save-answer', restrictTo(ROLES.STUDENT), saveAnswer);
router.post('/student/:id/violation', restrictTo(ROLES.STUDENT), logViolation);

// Admin Exam Routes
router.route('/')
  .get(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), getAdminExams)
  .post(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), createExam);

router.route('/:id')
  .get(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDENT), getExamById)
  .patch(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), updateExam)
  .delete(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), deleteExam);

router.post('/:id/duplicate', restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), duplicateExam);

export default router;
