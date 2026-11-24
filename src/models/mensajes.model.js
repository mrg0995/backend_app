import db from '../config/db.js';

/**
 * Mensaje de una conversación.
 * @typedef {Object} Mensaje
 * @property {number} id
 * @property {number} id_conversacion
 * @property {number} id_emisor
 * @property {string} texto
 * @property {boolean} leido
 * @property {Date} fecha_creacion
 */

const COLUMNAS = 'id, id_conversacion, id_emisor, texto, leido, fecha_creacion';

/** MySQL guarda leido como 0 o 1: lo pasamos a true o false */
const aMensaje = (fila) => ({ ...fila, leido: fila.leido === 1 });

/**
 * Historial de una conversación, del más antiguo al más reciente.
 * @param {number} idConversacion
 * @returns {Promise<Mensaje[]>}
 */
const selectByConversacion = async (idConversacion) => {
    const [result] = await db.execute(
        `SELECT ${COLUMNAS} FROM mensaje WHERE id_conversacion = ? ORDER BY fecha_creacion ASC, id ASC`,
        [idConversacion]
    );
    return result.map(aMensaje);
}

/**
 * Marca como leídos los mensajes que me ha enviado el otro usuario en una conversación.
 * @param {number} idConversacion
 * @param {number} idUsuario - Quien lee: sus propios mensajes no se tocan.
 */
const marcarLeidos = async (idConversacion, idUsuario) => {
    const [result] = await db.execute(
        'UPDATE mensaje SET leido = TRUE WHERE id_conversacion = ? AND id_emisor <> ? AND leido = FALSE',
        [idConversacion, idUsuario]
    );
    return result;
}

/**
 * Un mensaje por su id.
 * @param {number} id
 * @returns {Promise<Mensaje|null>}
 */
const selectById = async (id) => {
    const [result] = await db.execute(`SELECT ${COLUMNAS} FROM mensaje WHERE id = ?`, [id]);
    if (result.length === 0) {
        return null;
    }
    return aMensaje(result[0]);
}

/**
 * Guarda un mensaje. Devuelve el resultado de MySQL para usar result.insertId.
 * @param {number} idConversacion
 * @param {number} idEmisor
 * @param {string} texto
 */
const insert = async (idConversacion, idEmisor, texto) => {
    const [result] = await db.execute(
        'INSERT INTO mensaje (id_conversacion, id_emisor, texto) VALUES (?, ?, ?)',
        [idConversacion, idEmisor, texto]
    );
    return result;
}

/**
 * Cuántos mensajes tiene una conversación (para saber si es el primero).
 * @param {number} idConversacion
 * @returns {Promise<number>}
 */
const countByConversacion = async (idConversacion) => {
    const [result] = await db.execute(
        'SELECT COUNT(*) AS total FROM mensaje WHERE id_conversacion = ?',
        [idConversacion]
    );
    return result[0].total;
}

export default { selectByConversacion, marcarLeidos, selectById, insert, countByConversacion };