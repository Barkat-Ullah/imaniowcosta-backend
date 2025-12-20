import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { inspireController } from './inspire.controller';
import { inspireValidation } from './inspire.validation';

const router = express.Router();

router.post('/', auth(), inspireController.createInspire);

router.post('/:id/send', inspireController.sendInspireManually);

router.get('/', auth(), inspireController.getInspireList);

router.get('/today', auth(), inspireController.getTodayInspireDate);

router.get('/:id', auth(), inspireController.getInspireById);

router.put('/:id', auth(), inspireController.updateInspire);

router.delete('/:id', auth(), inspireController.deleteInspire);

export const inspireRoutes = router;
