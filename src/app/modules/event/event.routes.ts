import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { eventController } from './event.controller';
import { eventValidation } from './event.validation';
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

router.put('/:id', auth(), eventController.updateEvent);

router.delete('/:id', auth(), eventController.deleteEvent);

export const eventRoutes = router;
