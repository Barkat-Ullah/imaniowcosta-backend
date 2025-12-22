import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { childrenController } from './children.controller';
import { childrenValidation } from './children.validation';
import { UserRoleEnum } from '@prisma/client';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.get(
  '/',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  childrenController.getChildrenList,
);

router.get(
  '/:id',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER, UserRoleEnum.ADMIN),
  childrenController.getChildrenById,
);

router.post(
  '/',
  auth(UserRoleEnum.USER),
  validateRequest.body(childrenValidation.createSchema),
  childrenController.createChildren,
);

router.put(
  '/:id',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  fileUploader.uploadSingle,
  childrenController.updateChildren,
);

router.delete(
  '/:id',
  auth(UserRoleEnum.USER, UserRoleEnum.CARE_GIVER),
  childrenController.deleteChildren,
);

export const childrenRoutes = router;
