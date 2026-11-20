import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { subirImagenes } from '../middlewares/upload.middleware.js';
import { subirFotos, borrarFoto } from '../controllers/fotos.controller.js';

const router = Router();

// El 10 es un tope técnico por petición; el límite real de 5 fotos por artículo lo aplica el controller (409)
router.post('/articulo/:idArticulo', checkToken, subirImagenes('fotos', 10), subirFotos);
router.delete('/:idFoto', checkToken, borrarFoto);

export default router;
