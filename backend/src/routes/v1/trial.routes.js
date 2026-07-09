import { Router } from 'express';
import { verifyJWT, restrictTo } from '../../middleware/auth.js';
import { ROLES } from '../../constants/index.js';
import {
  createTrialRequest,
  getTrialRequests,
  updateTrialRequestStatus,
  deleteTrialRequest
} from '../../controllers/trial.controller.js';

const router = Router();

// Public submission route
router.post('/', createTrialRequest);

// Secure routes for ADMIN and SUPER_ADMIN
router.use(verifyJWT);
router.use(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get('/', getTrialRequests);
router.patch('/:id', updateTrialRequestStatus);
router.delete('/:id', deleteTrialRequest);

export default router;
