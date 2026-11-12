import {Router} from "express";
import db from '../config/db.js';

import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import articulosRoutes from './articulos.routes.js';
import categoriasRoutes from './categorias.routes.js';
import fotosRoutes from './fotos.routes.js';
import busquedaRoutes from './busqueda.routes.js';
import conversacionesRoutes from './conversaciones.routes.js';
import mensajesRoutes from './mensajes.routes.js';
import notificacionesRoutes from './notificaciones.routes.js';
import reportesRoutes from './reportes.routes.js';
import moderacionRoutes from './moderacion.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Comprobación de que la API y la base de datos están funcionando correctamente
router.get('/health', async (req, res) => {
    try {
        await db.query('select 1');
        res.json({ status: 'ok', database: 'ok' });
    } catch (error) {
        res.status(503).json({ status: 'error', database: 'error' });
    }
});

// Rutas de usuarios
router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/articulos', articulosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/fotos', fotosRoutes);
router.use('/busqueda', busquedaRoutes);
router.use('/conversaciones', conversacionesRoutes);
router.use('/mensajes', mensajesRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/reportes', reportesRoutes);
router.use('/moderacion', moderacionRoutes);
router.use('/admin', adminRoutes);

export default router;