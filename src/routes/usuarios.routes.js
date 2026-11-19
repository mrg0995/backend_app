import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';
import { getPerfilPublico, getPerfil, updatePerfil, updateFoto } from '../controllers/usuarios.controller.js';
import { checkArticuloDueno } from '../middlewares/articulos.middleware.js';
import { getMisArticulos, getMiArticuloById } from '../controllers/articulos.controller.js';

const router = Router();

router.get('/perfil', checkToken, getPerfil);
router.put('/perfil', checkToken, updatePerfil);
router.put('/perfil/foto', checkToken, subirImagen('foto'), updateFoto);
router.get('/perfil/articulos', checkToken, getMisArticulos);
router.get('/perfil/articulos/:idArticulo', checkToken, checkArticuloDueno, getMiArticuloById);
router.get('/:idUsuario/publico', getPerfilPublico);

export default router;