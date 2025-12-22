import { UserRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { BehaviorLogController } from './behaviorLog.controller';

const router = express.Router();

router.put(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  BehaviorLogController.updateBehaviorLog,
);

router.get(
  '/:childId',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  BehaviorLogController.getBehaviorLogByChild,
);

export const BehaviorLogRoutes = router;
