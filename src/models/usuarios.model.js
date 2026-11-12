import db from '../config/db.js';

/**
 * Usuario tal como se devuelve al front: todas las columnas menos password_hash.
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre_usuario - Nombre público del usuario.
 * @property {string} email - Nunca se muestra a otros usuarios.
 * @property {'usuario'|'moderador'|'administrador'} rol
 * @property {string|null} foto_url - Ruta de la foto de perfil, por ejemplo '/uploads/foto.jpg'.
 * @property {string|null} ubicacion
 * @property {number} bloqueado - 1 si la cuenta está bloqueada, 0 si no.
 * @property {number} eliminado - 1 si la cuenta está eliminada (borrado lógico), 0 si no.
 * @property {Date} fecha_creacion
 */

/**
 * Usuario con su contraseña cifrada. Solo se usa en el login, nunca se devuelve al front.
 * @typedef {Usuario & { password_hash: string }} UsuarioConPassword
 */

/** Columnas que se pueden devolver al front: todas menos password_hash. */
const COLUMNAS = 'id, nombre_usuario, email, rol, foto_url, ubicacion, bloqueado, eliminado, fecha_creacion';

/**
 * Busca un usuario por su id, sin la contraseña.
 * @param {number} id - Id del usuario.
 * @returns {Promise<Usuario|null>} El usuario, o null si no existe.
 */
const selectById = async (id) => {
    const [result] = await db.execute(`SELECT ${COLUMNAS} FROM usuario WHERE id = ?`, [id]);
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Busca un usuario por su email, CON la contraseña cifrada.
 * Solo para el login: el resultado nunca se debe devolver al front tal cual.
 * @param {string} email - Email del usuario.
 * @returns {Promise<UsuarioConPassword|null>} El usuario con password_hash, o null si no existe.
 */
const selectByEmail = async (email) => {
    const [result] = await db.execute(`SELECT * FROM usuario WHERE email = ?`, [email]);
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Busca un usuario por su nombre de usuario, sin la contraseña.
 * Sirve para comprobar si un nombre ya está cogido al registrarse o al editar el perfil.
 * @param {string} nombre_usuario - Nombre de usuario a buscar.
 * @returns {Promise<Usuario|null>} El usuario, o null si no existe.
 */
const selectByNombreUsuario = async (nombre_usuario) => {
    const [result] = await db.execute(`SELECT ${COLUMNAS} FROM usuario WHERE nombre_usuario = ?`, [nombre_usuario]);
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Crea un usuario nuevo con el rol 'usuario'.
 * @param {string} nombre_usuario - Nombre público, único.
 * @param {string} email - Email, único.
 * @param {string} password_hash - Contraseña ya cifrada con bcrypt, nunca en claro.
 * @param {string} [ubicacion] - Opcional. Si no llega, se guarda NULL.
 * @returns {Promise<import('mysql2').ResultSetHeader>} Resultado del insert: el id nuevo está en insertId.
 */
const insert = async (nombre_usuario, email, password_hash, ubicacion) => {
    const [result] = await db.execute(
        `INSERT INTO usuario (nombre_usuario, email, password_hash, ubicacion) VALUES (?, ?, ?, ?)`,
        [nombre_usuario, email, password_hash, ubicacion ?? null]
    );
    return result;
}

/**
 * Edita los datos del perfil de un usuario.
 * @param {number} id - Id del usuario.
 * @param {Object} datos
 * @param {string} datos.nombre_usuario - Nuevo nombre de usuario.
 * @param {string} [datos.ubicacion] - Nueva ubicación. Si no llega, se guarda NULL.
 * @returns {Promise<import('mysql2').ResultSetHeader>} Resultado del update: affectedRows es 0 si el usuario no existe.
 */
const update = async (id, {nombre_usuario, ubicacion}) => {
    const [result] = await db.execute(
        `UPDATE usuario SET nombre_usuario = ?, ubicacion = ? WHERE id = ?`,
        [nombre_usuario, ubicacion ?? null, id]
    );
    return result;
}

/**
 * Cambia la foto de perfil de un usuario.
 * @param {number} id - Id del usuario.
 * @param {string} foto_url - Ruta de la foto ya guardada, por ejemplo '/uploads/foto.jpg'.
 * @returns {Promise<import('mysql2').ResultSetHeader>} Resultado del update.
 */
const updateFoto = async (id, foto_url) => {
    const [result] = await db.execute(
        `UPDATE usuario SET foto_url = ? WHERE id = ?`,
        [foto_url, id]
    );
    return result;
}

export default {selectById, selectByEmail, selectByNombreUsuario, insert, update, updateFoto};
