import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { activityController } from './activity.controller';
import { activityValidation } from './activity.validation';
import { fileUploader } from '../../utils/fileUploader';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

router.get('/', auth(), activityController.getActivityList);
router.get('/my', auth(UserRoleEnum.USER), activityController.getMyActivityList);

router.get('/:id', auth(), activityController.getActivityById);

router.post(
  '/',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.USER),
  fileUploader.uploadSingle,
  activityController.createActivity,
);

router.put('/:id', auth(), activityController.updateActivity);

router.delete('/:id', auth(), activityController.deleteActivity);

export const activityRoutes = router;
