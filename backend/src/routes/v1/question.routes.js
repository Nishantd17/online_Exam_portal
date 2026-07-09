import { Router } from 'express';
import { verifyJWT, restrictTo } from '../../middleware/auth.js';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions
} from '../../controllers/question.controller.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

router.use(verifyJWT);
router.use(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.route('/')
  .get(getQuestions)
  .post(createQuestion);

router.route('/:id')
  .get(getQuestionById)
  .patch(updateQuestion)
  .delete(deleteQuestion);

router.post('/bulk-import', bulkImportQuestions);

export default router;
