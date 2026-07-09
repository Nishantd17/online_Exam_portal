import { Router } from 'express';
import { verifyJWT, restrictTo } from '../../middleware/auth.js';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImport,
  exportStudents
} from '../../controllers/student.controller.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

// Secure all endpoints under student administration
router.use(verifyJWT);
router.use(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .patch(updateStudent)
  .delete(deleteStudent);

router.post('/bulk-import', bulkImport);
router.get('/export', exportStudents);

export default router;
