import conversacionesModel from '../models/conversaciones.model.js';

/**
 * Comprueba que la conversación existe y que el usuario participa en ella (comprador o vendedor).
 * Carga la conversación en req.conversacion. Va siempre DESPUÉS de checkToken.
 *
 * Respuestas:
 * - 400: el id no es un número válido
 * - 403: no participas en esta conversación
 * - 404: la conversación no existe
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const checkParticipante = async (req, res, next) => {
    const idConversacion = Number(req.params.idConversacion);
    if (!Number.isInteger(idConversacion) || idConversacion <= 0) {
        return res.status(400).json({ message: 'El id de la conversación no es válido' });
    }

    const conversacion = await conversacionesModel.selectById(idConversacion);
    if (!conversacion) {
        return res.status(404).json({ message: 'La conversación no existe' });
    }

    const idUsuario = req.usuario.id;
    if (conversacion.id_comprador !== idUsuario && conversacion.id_vendedor !== idUsuario) {
        return res.status(403).json({ message: 'No participas en esta conversación' });
    }

    req.conversacion = conversacion;
    next();
}