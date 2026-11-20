import pool from '../config/db.js';

// Formato completo (detalle) según docs/api.md
export const selectById = async (idArticulo) => {
    const [rows] = await pool.query(
        `SELECT 
            a.id,
            a.id_usuario,
            a.titulo,
            a.descripcion,
            a.precio,
            a.estado_conservacion,
            a.estado,
            a.ubicacion,
            a.fecha_creacion,
            a.fecha_actualizacion,
            c.id AS categoria_id,
            c.nombre AS categoria_nombre,
            u.nombre_usuario AS vendedor_nombre,
            u.foto_url AS vendedor_foto_url,
            u.ubicacion AS vendedor_ubicacion
        FROM articulo a
        JOIN categoria c ON a.id_categoria = c.id
        JOIN usuario u ON a.id_usuario = u.id
        WHERE a.id = ?`,
        [idArticulo]
    );

    if (rows.length === 0) return null;
    const row = rows[0];

    const [fotos] = await pool.query(
        'SELECT id, url, posicion FROM foto_articulo WHERE id_articulo = ? ORDER BY posicion ASC',
        [idArticulo]
    );

    return {
        id: row.id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        precio: Number(row.precio),
        estado_conservacion: row.estado_conservacion,
        estado: row.estado,
        ubicacion: row.ubicacion,
        categoria: {
            id: row.categoria_id,
            nombre: row.categoria_nombre
        },
        vendedor: {
            id: row.id_usuario,
            nombre_usuario: row.vendedor_nombre,
            foto_url: row.vendedor_foto_url,
            ubicacion: row.vendedor_ubicacion
        },
        fotos,
        fecha_creacion: row.fecha_creacion,
        fecha_actualizacion: row.fecha_actualizacion
    };
};

// Formato tarjeta para "Mis artículos" (todos los estados, más reciente primero)
export const selectByUsuario = async (idUsuario) => {
    const [rows] = await pool.query(
        `SELECT 
            a.id,
            a.titulo,
            a.precio,
            a.estado_conservacion,
            a.estado,
            a.ubicacion,
            a.id_usuario,
            u.nombre_usuario AS vendedor_nombre,
            (
                SELECT f.url 
                FROM foto_articulo f 
                WHERE f.id_articulo = a.id 
                ORDER BY f.posicion ASC 
                LIMIT 1
            ) AS foto_portada
        FROM articulo a
        JOIN usuario u ON a.id_usuario = u.id
        WHERE a.id_usuario = ?
        ORDER BY a.fecha_creacion DESC, a.id DESC`,
        [idUsuario]
    );

    return rows.map((row) => ({
        id: row.id,
        titulo: row.titulo,
        precio: Number(row.precio),
        estado_conservacion: row.estado_conservacion,
        estado: row.estado,
        ubicacion: row.ubicacion,
        foto_portada: row.foto_portada || null,
        vendedor: {
            id: row.id_usuario,
            nombre_usuario: row.vendedor_nombre
        }
    }));
};

export const insert = async ({ id_usuario, id_categoria, titulo, descripcion, precio, estado_conservacion, ubicacion }) => {
    const [result] = await pool.query(
        `INSERT INTO articulo 
            (id_usuario, id_categoria, titulo, descripcion, precio, estado_conservacion, estado, ubicacion)
         VALUES (?, ?, ?, ?, ?, ?, 'borrador', ?)`,
        [id_usuario, id_categoria, titulo, descripcion, precio, estado_conservacion, ubicacion]
    );
    return result.insertId;
};

export const update = async (idArticulo, { id_categoria, titulo, descripcion, precio, estado_conservacion, ubicacion }) => {
    await pool.query(
        `UPDATE articulo
         SET id_categoria = ?,
             titulo = ?,
             descripcion = ?,
             precio = ?,
             estado_conservacion = ?,
             ubicacion = ?
         WHERE id = ?`,
        [id_categoria, titulo, descripcion, precio, estado_conservacion, ubicacion, idArticulo]
    );
};

export const updateEstado = async (idArticulo, nuevoEstado) => {
    await pool.query(
        'UPDATE articulo SET estado = ? WHERE id = ?',
        [nuevoEstado, idArticulo]
    );
};

export const deleteById = async (idArticulo) => {
    await pool.query('DELETE FROM articulo WHERE id = ?', [idArticulo]);
};