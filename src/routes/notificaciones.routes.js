import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import {
    getNotificaciones,
    getSinLeer,
    marcarLeida,
    marcarTodasLeidas
} from '../controllers/notificaciones.controller.js';

const router = Router();

// Todas las rutas de notificaciones necesitan sesión
router.use(checkToken);

// Rutas de notificaciones.
// /sin-leer y /leidas van antes que /:idNotificacion para que no se confundan con un id.
router.get('/', getNotificaciones);
router.get('/sin-leer', getSinLeer);
router.patch('/leidas', marcarTodasLeidas);
router.patch('/:idNotificacion/leida', marcarLeida);

export default router;
