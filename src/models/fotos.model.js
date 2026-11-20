import db from '../config/db.js';

/**
 * Foto de un artículo.
 * @typedef {Object} Foto
 * @property {number} id
 * @property {number} id_articulo
 * @property {string} url - Ruta de la imagen, por ejemplo '/uploads/123.jpg'.
 * @property {number} posicion - 0 es la portada.
 */

/**
 * Busca un artículo y devuelve solo su id y su dueño.
 * @param {number} idArticulo
 * @returns {Promise<{id: number, id_usuario: number}|null>} El artículo, o null si no existe.
 */
const selectArticulo = async (idArticulo) => {
    const [result] = await db.execute(`SELECT id, id_usuario FROM articulo WHERE id = ?`, [idArticulo]);
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Devuelve las fotos de un artículo ordenadas por posición (la portada primero).
 * @param {number} idArticulo
 * @returns {Promise<Foto[]>}
 */
const selectByArticulo = async (idArticulo) => {
    const [result] = await db.execute(
        `SELECT id, url, posicion FROM foto_articulo WHERE id_articulo = ? ORDER BY posicion`,
        [idArticulo]
    );
    return result;
}

/**
 * Busca una foto por su id e incluye el dueño de su artículo (id_usuario).
 * @param {number} id - Id de la foto.
 * @returns {Promise<(Foto & {id_usuario: number})|null>} La foto, o null si no existe.
 */
const selectById = async (id) => {
    const [result] = await db.execute(
        `SELECT f.id, f.id_articulo, f.url, f.posicion, a.id_usuario
         FROM foto_articulo f JOIN articulo a ON a.id = f.id_articulo
         WHERE f.id = ?`,
        [id]
    );
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Cuenta cuántas fotos tiene un artículo.
 * @param {number} idArticulo
 * @returns {Promise<number>}
 */
const countByArticulo = async (idArticulo) => {
    const [result] = await db.execute(
        `SELECT COUNT(*) AS total FROM foto_articulo WHERE id_articulo = ?`,
        [idArticulo]
    );
    return Number(result[0].total);
}

/**
 * Añade una foto a un artículo en la posición indicada.
 * @param {number} id_articulo
 * @param {string} url - Ruta de la imagen ya guardada.
 * @param {number} posicion
 * @returns {Promise<import('mysql2').ResultSetHeader>} El id nuevo está en insertId.
 */
const insert = async (id_articulo, url, posicion) => {
    const [result] = await db.execute(
        `INSERT INTO foto_articulo (id_articulo, url, posicion) VALUES (?, ?, ?)`,
        [id_articulo, url, posicion]
    );
    return result;
}

/**
 * Borra una foto de la base de datos. No borra el archivo de uploads/.
 * @param {number} id - Id de la foto.
 * @returns {Promise<import('mysql2').ResultSetHeader>}
 */
const deleteById = async (id) => {
    const [result] = await db.execute(`DELETE FROM foto_articulo WHERE id = ?`, [id]);
    return result;
}

/**
 * Sube un puesto las fotos que estaban detrás de la posición borrada, para no dejar huecos.
 * El ORDER BY hace que se muevan de menor a mayor y no choque UNIQUE (id_articulo, posicion).
 * @param {number} idArticulo
 * @param {number} posicionBorrada
 * @returns {Promise<import('mysql2').ResultSetHeader>}
 */
const moverPosiciones = async (idArticulo, posicionBorrada) => {
    const [result] = await db.execute(
        `UPDATE foto_articulo SET posicion = posicion - 1
         WHERE id_articulo = ? AND posicion > ?
         ORDER BY posicion ASC`,
        [idArticulo, posicionBorrada]
    );
    return result;
}

export default {selectArticulo, selectByArticulo, selectById, countByArticulo, insert, deleteById, moverPosiciones};
