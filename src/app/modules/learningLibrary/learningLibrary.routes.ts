import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { learningLibraryController } from './learningLibrary.controller';
import { learningLibraryValidation } from './learningLibrary.validation';
import { UserRoleEnum } from '@prisma/client';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(UserRoleEnum.ADMIN),
  fileUploader.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  // validateRequest.body(learningLibraryValidation.createSchema),
  learningLibraryController.createLearningLibrary,
);

router.get(
  '/',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  learningLibraryController.getLearningLibraryList,
);
router.get(
  '/all',
  learningLibraryController.getAllArticle,
);

router.get(
  '/all/:articleId',
  learningLibraryController.getArticleById,
);
router.get(
  '/:id',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  learningLibraryController.getLearningLibraryById,
);

router.put(
  '/:id',
  auth(UserRoleEnum.ADMIN),
  fileUploader.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  learningLibraryController.updateLearningLibrary,
);

router.delete('/:id', auth(), learningLibraryController.deleteLearningLibrary);

export const learningLibraryRoutes = router;
