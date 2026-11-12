import { Router } from 'express';
import { getPerfilPublico } from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/:idUsuario/publico', getPerfilPublico);

export default router;