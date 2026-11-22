import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { checkArticuloDueno } from '../middlewares/articulos.middleware.js';
import { subirImagenes } from '../middlewares/upload.middleware.js';
import { subirFotos, borrarFoto } from '../controllers/fotos.controller.js';

const router = Router();

// checkArticuloDueno va antes que subirImagenes: si el artículo no es tuyo, las fotos ni se guardan.
// El 10 es un tope técnico por petición; el límite real de 5 fotos por artículo lo aplica el controller (409)
router.post('/articulo/:idArticulo', checkToken, checkArticuloDueno, subirImagenes('fotos', 10), subirFotos);
router.delete('/:idFoto', checkToken, borrarFoto);

export default router;
