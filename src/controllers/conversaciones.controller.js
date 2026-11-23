import conversacionesModel from '../models/conversaciones.model.js';
import mensajesModel from '../models/mensajes.model.js';
import * as ArticulosModel from '../models/articulos.model.js';

/**
 * Abre el chat de un comprador con el vendedor de un artículo.
 * Si ya existe, devuelve la que hay (200); si no, la crea (201).
 *
 * POST /api/conversaciones
 * Body: { id_articulo }
 *
 * Respuestas:
 * - 200 o 201: la conversación
 * - 400: falta id_articulo o no es un número
 * - 403: el artículo es tuyo
 * - 404: el artículo no existe o no está publicado
 */
export const abrir = async (req, res) => {
    const idArticulo = Number(req.body?.id_articulo);
    if (!Number.isInteger(idArticulo) || idArticulo <= 0) {
        return res.status(400).json({ message: 'Falta el id del artículo o no es válido' });
    }

    const articulo = await ArticulosModel.selectById(idArticulo);
    if (!articulo || articulo.estado !== 'publicado') {
        return res.status(404).json({ message: 'El artículo no existe o no está publicado' });
    }

    const idComprador = req.usuario.id;
    if (articulo.vendedor.id === idComprador) {
        return res.status(403).json({ message: 'No puedes abrir un chat sobre tu propio artículo' });
    }

    const existente = await conversacionesModel.selectByArticuloComprador(idArticulo, idComprador);
    if (existente) {
        const conversacion = await conversacionesModel.selectParaUsuario(existente.id, idComprador);
        return res.json(conversacion);
    }

    let idConversacion;
    try {
        const result = await conversacionesModel.insert(idArticulo, idComprador, articulo.vendedor.id);
        idConversacion = result.insertId;
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            throw error;
        }
        const creada = await conversacionesModel.selectByArticuloComprador(idArticulo, idComprador);
        const conversacion = await conversacionesModel.selectParaUsuario(creada.id, idComprador);
        return res.json(conversacion);
    }

    const conversacion = await conversacionesModel.selectParaUsuario(idConversacion, idComprador);
    res.status(201).json(conversacion);
}

/**
 * Mi bandeja: mis conversaciones como comprador y como vendedor.
 * GET /api/conversaciones
 */
export const getAll = async (req, res) => {
    const conversaciones = await conversacionesModel.selectByUsuario(req.usuario.id);
    res.json(conversaciones);
}

/**
 * Número de mensajes sin leer (contador de la cabecera).
 * GET /api/conversaciones/sin-leer
 */
export const getSinLeer = async (req, res) => {
    const total = await conversacionesModel.countSinLeer(req.usuario.id);
    res.json({ sin_leer: total });
}

/**
 * Una conversación (cabecera del chat). Usa checkParticipante.
 * GET /api/conversaciones/:idConversacion
 */
export const getById = async (req, res) => {
    const conversacion = await conversacionesModel.selectParaUsuario(req.conversacion.id, req.usuario.id);
    res.json(conversacion);
}

/**
 * Historial de mensajes, del más antiguo al más reciente. Usa checkParticipante.
 * GET /api/conversaciones/:idConversacion/mensajes
 */
export const getMensajes = async (req, res) => {
    const mensajes = await mensajesModel.selectByConversacion(req.conversacion.id);
    res.json(mensajes);
}

/**
 * Marca como leídos los mensajes que me ha enviado el otro. Usa checkParticipante.
 * PATCH /api/conversaciones/:idConversacion/leida
 */
export const marcarLeida = async (req, res) => {
    await mensajesModel.marcarLeidos(req.conversacion.id, req.usuario.id);
    res.json({ message: 'Conversación marcada como leída' });
}