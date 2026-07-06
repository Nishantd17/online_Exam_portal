import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import questionRoutes from './question.routes.js';
import examRoutes from './exam.routes.js';
import resultRoutes from './result.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin/students', studentRoutes);
router.use('/admin/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);

export default router;
