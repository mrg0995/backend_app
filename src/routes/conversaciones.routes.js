import { Router } from 'express';
import { checkToken } from '../middlewares/auth.middleware.js';
import { checkParticipante } from '../middlewares/conversaciones.middleware.js';
import { abrir, getAll, getSinLeer, getById, getMensajes, marcarLeida } from '../controllers/conversaciones.controller.js';

const router = Router();

router.post('/', checkToken, abrir);
router.get('/', checkToken, getAll);
router.get('/sin-leer', checkToken, getSinLeer);
router.get('/:idConversacion', checkToken, checkParticipante, getById);
router.get('/:idConversacion/mensajes', checkToken, checkParticipante, getMensajes);
router.patch('/:idConversacion/leida', checkToken, checkParticipante, marcarLeida);

export default router;