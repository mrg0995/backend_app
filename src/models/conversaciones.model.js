import db from '../config/db.js';

/**
 * Conversación vista por uno de sus dos participantes (el formato de docs/api.md).
 * @typedef {Object} Conversacion
 * @property {number} id
 * @property {{id: number, titulo: string, precio: number, estado: string, foto_portada: string|null}} articulo
 * @property {{id: number, nombre_usuario: string, foto_url: string|null}} otro_usuario
 * @property {'comprador'|'vendedor'} soy
 * @property {{texto: string, id_emisor: number, fecha_creacion: Date}|null} ultimo_mensaje
 * @property {number} sin_leer
 * @property {Date} fecha_creacion
 */

/**
 * Consulta de las conversaciones vistas por un usuario. Lleva 3 «?» para el id del usuario
 * (sin_leer, soy y otro usuario) y después va el WHERE de cada función.
 * El último mensaje y los no leídos van en subconsultas, así es una sola consulta para toda la bandeja.
 */
const SELECT_CONVERSACION = `
    SELECT c.id, c.fecha_creacion,
        a.id AS articulo_id, a.titulo, a.precio, a.estado,
        (SELECT f.url FROM foto_articulo f WHERE f.id_articulo = a.id ORDER BY f.posicion LIMIT 1) AS foto_portada,
        u.id AS otro_id, u.nombre_usuario AS otro_nombre, u.foto_url AS otro_foto,
        m.texto AS ultimo_texto, m.id_emisor AS ultimo_emisor, m.fecha_creacion AS ultimo_fecha,
        (SELECT COUNT(*) FROM mensaje ml
            WHERE ml.id_conversacion = c.id AND ml.id_emisor <> ? AND ml.leido = FALSE) AS sin_leer,
        c.id_vendedor = ? AS soy_vendedor
    FROM conversacion c
    JOIN articulo a ON a.id = c.id_articulo
    JOIN usuario u ON u.id = IF(c.id_comprador = ?, c.id_vendedor, c.id_comprador)
    LEFT JOIN mensaje m ON m.id = (SELECT MAX(mu.id) FROM mensaje mu WHERE mu.id_conversacion = c.id)`;

/**
 * Pasa una fila de SELECT_CONVERSACION al formato del contrato.
 * @returns {Conversacion}
 */
const aConversacion = (fila) => ({
    id: fila.id,
    articulo: {
        id: fila.articulo_id,
        titulo: fila.titulo,
        precio: fila.precio,
        estado: fila.estado,
        foto_portada: fila.foto_portada
    },
    otro_usuario: { id: fila.otro_id, nombre_usuario: fila.otro_nombre, foto_url: fila.otro_foto },
    soy: fila.soy_vendedor === 1 ? 'vendedor' : 'comprador',
    ultimo_mensaje: fila.ultimo_texto === null
        ? null
        : { texto: fila.ultimo_texto, id_emisor: fila.ultimo_emisor, fecha_creacion: fila.ultimo_fecha },
    sin_leer: fila.sin_leer,
    fecha_creacion: fila.fecha_creacion
});

/**
 * Mi bandeja: las conversaciones en las que participo, la del mensaje más reciente primero.
 * @param {number} idUsuario
 * @returns {Promise<Conversacion[]>}
 */
const selectByUsuario = async (idUsuario) => {
    const [result] = await db.execute(
        `${SELECT_CONVERSACION}
        WHERE c.id_comprador = ? OR c.id_vendedor = ?
        ORDER BY COALESCE(m.fecha_creacion, c.fecha_creacion) DESC, c.id DESC`,
        [idUsuario, idUsuario, idUsuario, idUsuario, idUsuario]
    );
    return result.map(aConversacion);
}

/**
 * Una conversación vista por uno de sus participantes.
 * @param {number} idConversacion
 * @param {number} idUsuario - Quien la mira (para saber quién es «el otro» y sus no leídos).
 * @returns {Promise<Conversacion|null>}
 */
const selectParaUsuario = async (idConversacion, idUsuario) => {
    const [result] = await db.execute(
        `${SELECT_CONVERSACION} WHERE c.id = ?`,
        [idUsuario, idUsuario, idUsuario, idConversacion]
    );
    if (result.length === 0) {
        return null;
    }
    return aConversacion(result[0]);
}

/**
 * La fila tal cual de la tabla, para comprobar quién participa (checkParticipante).
 * @param {number} idConversacion
 * @returns {Promise<{id: number, id_articulo: number, id_comprador: number, id_vendedor: number}|null>}
 */
const selectById = async (idConversacion) => {
    const [result] = await db.execute(
        'SELECT id, id_articulo, id_comprador, id_vendedor FROM conversacion WHERE id = ?',
        [idConversacion]
    );
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * La conversación de un comprador sobre un artículo (solo puede haber una).
 * @param {number} idArticulo
 * @param {number} idComprador
 * @returns {Promise<{id: number}|null>}
 */
const selectByArticuloComprador = async (idArticulo, idComprador) => {
    const [result] = await db.execute(
        'SELECT id FROM conversacion WHERE id_articulo = ? AND id_comprador = ?',
        [idArticulo, idComprador]
    );
    if (result.length === 0) {
        return null;
    }
    return result[0];
}

/**
 * Crea una conversación. Devuelve el resultado de MySQL para usar result.insertId.
 * @param {number} idArticulo
 * @param {number} idComprador
 * @param {number} idVendedor
 */
const insert = async (idArticulo, idComprador, idVendedor) => {
    const [result] = await db.execute(
        'INSERT INTO conversacion (id_articulo, id_comprador, id_vendedor) VALUES (?, ?, ?)',
        [idArticulo, idComprador, idVendedor]
    );
    return result;
}

/**
 * Mensajes sin leer de un usuario en todas sus conversaciones (contador de la cabecera).
 * @param {number} idUsuario
 * @returns {Promise<number>}
 */
const countSinLeer = async (idUsuario) => {
    const [result] = await db.execute(
        `SELECT COUNT(*) AS total
        FROM mensaje m
        JOIN conversacion c ON c.id = m.id_conversacion
        WHERE (c.id_comprador = ? OR c.id_vendedor = ?) AND m.id_emisor <> ? AND m.leido = FALSE`,
        [idUsuario, idUsuario, idUsuario]
    );
    return result[0].total;
}

/**
 * Ids de los compradores que tienen una conversación sobre un artículo
 * (para avisarles cuando se vende).
 * @param {number} idArticulo
 * @returns {Promise<number[]>}
 */
const selectCompradoresByArticulo = async (idArticulo) => {
    const [result] = await db.execute(
        'SELECT id_comprador FROM conversacion WHERE id_articulo = ?',
        [idArticulo]
    );
    return result.map((fila) => fila.id_comprador);
}

export default { selectByUsuario, selectParaUsuario, selectById, selectByArticuloComprador, insert, countSinLeer, selectCompradoresByArticulo };