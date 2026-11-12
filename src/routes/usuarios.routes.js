import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';
import { getPerfilPublico, getPerfil, updatePerfil, updateFoto } from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/perfil', checkToken, getPerfil);
router.put('/perfil', checkToken, updatePerfil);
router.put('/perfil/foto', checkToken, subirImagen('foto'), updateFoto);
router.get('/:idUsuario/publico', getPerfilPublico);

export default router;