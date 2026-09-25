import { Router } from 'express';
import { demoController } from './demo.controller.js';

const router = Router();

router.post('/reseed', demoController.reseed.bind(demoController));
router.post('/simulate-carrier', demoController.simulateCarrier.bind(demoController));
router.post('/test-illegal-transition', demoController.testIllegalTransition.bind(demoController));

export const demoRoutes = router;
