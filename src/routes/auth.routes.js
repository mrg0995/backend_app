import { Router } from 'express';
import { registro } from '../controllers/auth.controller.js';

const router = Router();

// Rutas de auth
router.post('/registro', registro);

export default router;
