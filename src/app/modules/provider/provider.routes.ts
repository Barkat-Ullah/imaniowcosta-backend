import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { providerController } from './provider.controller';
import { providerValidation } from './provider.validation';

const router = express.Router();

router.post('/', auth(), providerController.createProvider);

router.get('/all/:childId', auth(), providerController.getProviderList);

router.get('/:id', auth(), providerController.getProviderById);

router.put('/:id', auth(), providerController.updateProvider);

router.delete('/:id', auth(), providerController.deleteProvider);

export const providerRoutes = router;
