import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { subscriptionController } from './subscription.controller';
import { subscriptionValidation } from './subscription.validation';

const router = express.Router();

router.post('/', auth(), subscriptionController.createSubscription);

router.get('/', auth(), subscriptionController.getSubscriptionList);

router.get('/:id', auth(), subscriptionController.getSubscriptionById);

router.put('/:id', auth(), subscriptionController.updateSubscription);

router.delete('/:id', auth(), subscriptionController.deleteSubscription);

export const subscriptionRoutes = router;