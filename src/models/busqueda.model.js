import pool from '../config/db.js';

// El ORDER BY no se puede parametrizar con ?. Solo usamos estas tres opciones.
const ORDENES = {
    recientes: 'a.fecha_creacion DESC, a.id DESC',
    precio_asc: 'a.precio ASC, a.id DESC',
    precio_desc: 'a.precio DESC, a.id DESC'
};

function singularizar(palabra) {
    if (palabra.length > 4 && palabra.endsWith('es')) return palabra.slice(0, -2);
    if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
    return palabra;
}

// Evitamos que los caracteres % y _ se interpreten como comodines de LIKE.
function escaparLike(texto) {
    return texto.replace(/[\\%_]/g, '\\$&');
}

export function construirFiltros(filtros) {
    const condiciones = ["a.estado = 'publicado'"];
    const valores = [];

    if (filtros.q) {
        const palabras = filtros.q.split(/\s+/).map((p) => singularizar(p.toLowerCase()));
        for (const palabra of palabras) {
            const busqueda = `%${escaparLike(palabra)}%`;
            condiciones.push('(a.titulo LIKE ? OR a.descripcion LIKE ? OR c.nombre LIKE ?)');
            valores.push(busqueda, busqueda, busqueda);
        }
    }
    if (filtros.id_categoria !== undefined) {
        condiciones.push('a.id_categoria = ?');
        valores.push(filtros.id_categoria);
    }
    if (filtros.precio_min !== undefined) {
        condiciones.push('a.precio >= ?');
        valores.push(filtros.precio_min);
    }
    if (filtros.precio_max !== undefined) {
        condiciones.push('a.precio <= ?');
        valores.push(filtros.precio_max);
    }
    if (filtros.estado_conservacion) {
        condiciones.push('a.estado_conservacion = ?');
        valores.push(filtros.estado_conservacion);
    }
    if (filtros.ubicacion) {
        condiciones.push('a.ubicacion LIKE ?');
        valores.push(`%${escaparLike(filtros.ubicacion)}%`);
    }
    if (filtros.id_vendedor !== undefined) {
        condiciones.push('a.id_usuario = ?');
        valores.push(filtros.id_vendedor);
    }

    return { where: condiciones.join(' AND '), valores };
}

export async function buscar(filtros) {
    const { where, valores } = construirFiltros(filtros);
    const tablas = `FROM articulo a
        JOIN categoria c ON a.id_categoria = c.id
        JOIN usuario u ON a.id_usuario = u.id`;

    const [conteo] = await pool.query(
        `SELECT COUNT(*) AS total ${tablas} WHERE ${where}`,
        valores
    );

    const desplazamiento = (filtros.pagina - 1) * filtros.por_pagina;
    const [filas] = await pool.query(
        `SELECT a.id, a.titulo, a.precio, a.estado_conservacion, a.estado,
                a.ubicacion, u.id AS vendedor_id, u.nombre_usuario AS vendedor_nombre,
                (SELECT f.url FROM foto_articulo f WHERE f.id_articulo = a.id
                 ORDER BY f.posicion ASC LIMIT 1) AS foto_portada
         ${tablas}
         WHERE ${where}
         ORDER BY ${ORDENES[filtros.orden]}
         LIMIT ? OFFSET ?`,
        [...valores, filtros.por_pagina, desplazamiento]
    );

    return {
        articulos: filas.map((a) => ({
            id: a.id,
            titulo: a.titulo,
            precio: Number(a.precio),
            estado_conservacion: a.estado_conservacion,
            estado: a.estado,
            ubicacion: a.ubicacion,
            foto_portada: a.foto_portada ?? null,
            vendedor: { id: a.vendedor_id, nombre_usuario: a.vendedor_nombre }
        })),
        total: Number(conteo[0].total),
        pagina: filtros.pagina,
        por_pagina: filtros.por_pagina
    };
}
