import express from 'express';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';
import { analyticsController } from './Analytics.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  analyticsController.getAnalyticsArticleByPeriodData,
);
router.get(
  '/:childId',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  analyticsController.getAnalyticsByPeriodData,
);

export const AnalyticsRoutes = router;
