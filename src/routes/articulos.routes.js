import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { checkArticuloDueno } from '../middlewares/articulos.middleware.js';
import {
    getByIdPublico,
    create,
    update,
    remove,
    publicar,
    marcarVendido
} from '../controllers/articulos.controller.js';

const router = Router();

// Persona 3 (Adel) añade aquí: router.get('/', buscarArticulos);

router.get('/:idArticulo', getByIdPublico);
router.post('/', checkToken, create);
router.put('/:idArticulo', checkToken, checkArticuloDueno, update);
router.delete('/:idArticulo', checkToken, checkArticuloDueno, remove);
router.patch('/:idArticulo/publicar', checkToken, checkArticuloDueno, publicar);
router.patch('/:idArticulo/vendido', checkToken, checkArticuloDueno, marcarVendido);

export default router;
