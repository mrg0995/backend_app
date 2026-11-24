import pool from '../config/db.js';

/** Columnas que se devuelven de una notificación (sin id_usuario: siempre es la tuya) */
const COLUMNAS = 'id, tipo, texto, enlace, leida, fecha_creacion';

/** MySQL guarda leida como 0 o 1: se devuelve como true o false, como dice el contrato */
const formatear = (fila) => (fila ? { ...fila, leida: Boolean(fila.leida) } : null);

/**
 * Guarda una notificación nueva (sin leer).
 * @param {number} idUsuario - A quién va dirigida
 * @param {'mensaje'|'cambio_estado'|'moderacion'} tipo
 * @param {string} texto
 * @param {string|null} enlace - Ruta del front a la que lleva, por ejemplo '/mensajes/12'
 * @returns {Promise<number>} El id de la notificación creada
 */
const insert = async (idUsuario, tipo, texto, enlace) => {
    const [resultado] = await pool.query(
        'INSERT INTO notificacion (id_usuario, tipo, texto, enlace) VALUES (?, ?, ?, ?)',
        [idUsuario, tipo, texto, enlace]
    );
    return resultado.insertId;
};

/**
 * Una notificación por su id, con el id_usuario para comprobar de quién es.
 * @param {number} id
 */
const selectById = async (id) => {
    const [filas] = await pool.query(
        `SELECT id_usuario, ${COLUMNAS} FROM notificacion WHERE id = ?`,
        [id]
    );
    return formatear(filas[0]);
};

/**
 * Las notificaciones más recientes de un usuario, de la más nueva a la más antigua.
 * @param {number} idUsuario
 * @param {number} [limite=50]
 */
const selectByUsuario = async (idUsuario, limite = 50) => {
    const [filas] = await pool.query(
        `SELECT ${COLUMNAS} FROM notificacion
         WHERE id_usuario = ?
         ORDER BY fecha_creacion DESC, id DESC
         LIMIT ?`,
        [idUsuario, limite]
    );
    return filas.map(formatear);
};

/**
 * Cuántas notificaciones sin leer tiene un usuario.
 * @param {number} idUsuario
 * @returns {Promise<number>}
 */
const countSinLeer = async (idUsuario) => {
    const [filas] = await pool.query(
        'SELECT COUNT(*) AS total FROM notificacion WHERE id_usuario = ? AND leida = FALSE',
        [idUsuario]
    );
    return filas[0].total;
};

/**
 * Marca una notificación como leída.
 * @param {number} id
 */
const updateLeida = async (id) => {
    await pool.query('UPDATE notificacion SET leida = TRUE WHERE id = ?', [id]);
};

/**
 * Marca como leídas todas las notificaciones de un usuario.
 * @param {number} idUsuario
 */
const updateTodasLeidas = async (idUsuario) => {
    await pool.query(
        'UPDATE notificacion SET leida = TRUE WHERE id_usuario = ? AND leida = FALSE',
        [idUsuario]
    );
};

export default { insert, selectById, selectByUsuario, countSinLeer, updateLeida, updateTodasLeidas };
