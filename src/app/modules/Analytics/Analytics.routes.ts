import express from 'express';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';
import { getWeeklyAnalyticsData } from './Analytics.controller';

const router = express.Router();

router.get(
  '/:childId',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  getWeeklyAnalyticsData,
);

export const AnalyticsRoutes = router;
