import notificacionesModel from '../models/notificaciones.model.js';

/**
 * Mis 50 notificaciones más recientes, de la más nueva a la más antigua.
 *
 * GET /api/notificaciones
 *
 * Respuestas:
 * - 200: array de notificaciones
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getNotificaciones = async (req, res) => {
    const notificaciones = await notificacionesModel.selectByUsuario(req.usuario.id, 50);
    res.json(notificaciones);
};

/**
 * Cuántas notificaciones tengo sin leer (para el aviso de la cabecera).
 *
 * GET /api/notificaciones/sin-leer
 *
 * Respuestas:
 * - 200: { sin_leer }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getSinLeer = async (req, res) => {
    const sin_leer = await notificacionesModel.countSinLeer(req.usuario.id);
    res.json({ sin_leer });
};

/**
 * Marca una de mis notificaciones como leída.
 *
 * PATCH /api/notificaciones/:idNotificacion/leida
 *
 * Respuestas:
 * - 200: la notificación actualizada
 * - 400: el id no es un número
 * - 403: la notificación no es tuya
 * - 404: la notificación no existe
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const marcarLeida = async (req, res) => {
    const idNotificacion = Number(req.params.idNotificacion);
    if (!Number.isInteger(idNotificacion) || idNotificacion <= 0) {
        return res.status(400).json({ message: 'El id de la notificación no es válido' });
    }

    const notificacion = await notificacionesModel.selectById(idNotificacion);
    if (!notificacion) {
        return res.status(404).json({ message: 'La notificación no existe' });
    }
    if (notificacion.id_usuario !== req.usuario.id) {
        return res.status(403).json({ message: 'La notificación no es tuya' });
    }

    await notificacionesModel.updateLeida(idNotificacion);
    const { id_usuario, ...actualizada } = await notificacionesModel.selectById(idNotificacion);
    res.json(actualizada);
};

/**
 * Marca todas mis notificaciones como leídas.
 *
 * PATCH /api/notificaciones/leidas
 *
 * Respuestas:
 * - 200: { message }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const marcarTodasLeidas = async (req, res) => {
    await notificacionesModel.updateTodasLeidas(req.usuario.id);
    res.json({ message: 'Notificaciones marcadas como leídas' });
};
