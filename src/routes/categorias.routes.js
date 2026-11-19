import { Router } from 'express';
import { getAll } from '../controllers/categorias.controller.js';

const router = Router();

// Rutas de categorias
router.get('/', getAll);

export default router;
