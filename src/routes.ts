import { Router } from 'express';
import container from './container';
import { AdminController } from './controllers/admin.controller';
import { validateBody } from './middlewares';
import { createFlagSchema, updateFlagSchema } from './middlewares/schemas';

const router = Router();

const adminController = new AdminController(container.featureFlagService);

// Admin routes - Feature Flag Management
router.get('/admin/features', (req, res) => adminController.getAllFlags(req, res));
router.get('/admin/features/:key', (req, res) => adminController.getFlag(req, res));
router.put('/admin/features/:key', validateBody(updateFlagSchema), (req, res) => adminController.updateFlag(req, res));
router.post('/admin/features', validateBody(createFlagSchema), (req, res) => adminController.createFlag(req, res));

export default router;
