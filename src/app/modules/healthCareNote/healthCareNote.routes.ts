import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { healthCareNoteController } from './healthCareNote.controller';
import { healthCareNoteValidation } from './healthCareNote.validation';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(),
  fileUploader.uploadSingle,
  healthCareNoteController.createHealthCareNote,
);

router.get(
  '/all/:childId',
  auth(),
  healthCareNoteController.getHealthCareNoteList,
);

router.get('/:id', auth(), healthCareNoteController.getHealthCareNoteById);

router.put(
  '/:id',
  auth(),
  fileUploader.uploadSingle,
  healthCareNoteController.updateHealthCareNote,
);

router.delete('/:id', auth(), healthCareNoteController.deleteHealthCareNote);

export const healthCareNoteRoutes = router;
