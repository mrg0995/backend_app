import { Router } from 'express';
import { registro, login } from '../controllers/auth.controller.js';

const router = Router();

// Rutas de auth
router.post('/registro', registro);
router.post('/login', login);

export default router;
