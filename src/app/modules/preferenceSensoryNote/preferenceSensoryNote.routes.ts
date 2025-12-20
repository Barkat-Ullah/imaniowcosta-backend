import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { preferenceSensoryNoteController } from './preferenceSensoryNote.controller';
import { preferenceSensoryNoteValidation } from './preferenceSensoryNote.validation';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(),
  fileUploader.uploadSingle,
  preferenceSensoryNoteController.createPreferenceSensoryNote,
);

router.get(
  '/all/:childId',
  auth(),
  preferenceSensoryNoteController.getPreferenceSensoryNoteList,
);

router.get(
  '/:id',
  auth(),
  preferenceSensoryNoteController.getPreferenceSensoryNoteById,
);

router.put(
  '/:id',
  auth(),
  fileUploader.uploadSingle,
  preferenceSensoryNoteController.updatePreferenceSensoryNote,
);

router.delete(
  '/:id',
  auth(),
  preferenceSensoryNoteController.deletePreferenceSensoryNote,
);

export const preferenceSensoryNoteRoutes = router;
