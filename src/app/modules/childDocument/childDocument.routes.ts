import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { childDocumentController } from './childDocument.controller';
import { childDocumentValidation } from './childDocument.validation';
import { UserRoleEnum } from '@prisma/client';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  fileUploader.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
    { name: 'files', maxCount: 5 },
  ]),
  childDocumentController.createChildDocument,
);

router.get('/all/:childId', auth(), childDocumentController.getChildDocumentList);

router.get('/:id', auth(), childDocumentController.getChildDocumentById);

router.put('/:id', auth(), childDocumentController.updateChildDocument);

router.delete('/:id', auth(), childDocumentController.deleteChildDocument);

export const childDocumentRoutes = router;
