import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { getPerfilPublico, getPerfil, updatePerfil } from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/perfil', checkToken, getPerfil);
router.put('/perfil', checkToken, updatePerfil);
router.get('/:idUsuario/publico', getPerfilPublico);

export default router;