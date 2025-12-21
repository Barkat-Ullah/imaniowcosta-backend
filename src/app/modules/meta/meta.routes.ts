import express from 'express';
import { MetaController } from './meta.controller';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

router.get('/admin', auth(UserRoleEnum.ADMIN), MetaController.getDashboardData);

export const MetaRoutes = router;
