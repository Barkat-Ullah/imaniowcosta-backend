import express from 'express';
import auth from '../../middlewares/auth';
import { eventController } from './event.controller';
import { UserRoleEnum } from '@prisma/client';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  fileUploader.uploadSingle,
  eventController.createEvent,
);

router.get(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  eventController.getEventList,
);

router.get('/:id', auth(), eventController.getEventById);

router.put(
  '/:id',
  auth(),
  fileUploader.uploadSingle,
  eventController.updateEvent,
);
router.patch(
  '/:id',
  auth(),
  eventController.markAsCompleted,
);

router.delete('/:id', auth(), eventController.deleteEvent);

export const eventRoutes = router;
