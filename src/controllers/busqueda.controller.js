import * as BusquedaModel from '../models/busqueda.model.js';

const CAMPOS = [
    'q', 'id_categoria', 'precio_min', 'precio_max', 'estado_conservacion',
    'ubicacion', 'id_vendedor', 'orden', 'pagina', 'por_pagina'
];
const ESTADOS = ['nuevo', 'como_nuevo', 'buen_estado', 'aceptable'];
const ORDENES = ['recientes', 'precio_asc', 'precio_desc'];

function texto(query, campo, maximo) {
    const valor = query[campo];
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || valor.trim().length > maximo) {
        throw new Error(`Parámetro ${campo} no válido`);
    }
    return valor.trim();
}

function entero(query, campo, defecto, maximo = 2147483647) {
    const valor = texto(query, campo, 15);
    if (valor === undefined) return defecto;
    if (!/^[1-9]\d*$/.test(valor) || Number(valor) > maximo) {
        throw new Error(`Parámetro ${campo} no válido`);
    }
    return Number(valor);
}

function precio(query, campo) {
    const valor = texto(query, campo, 25);
    if (valor === undefined) return undefined;
    if (!/^\d+(\.\d{1,2})?$/.test(valor) || Number(valor) > 99999999.99) {
        throw new Error(`Parámetro ${campo} no válido`);
    }
    return Number(valor);
}

export function validarFiltros(query) {
    for (const campo of Object.keys(query)) {
        if (!CAMPOS.includes(campo)) throw new Error(`Parámetro ${campo} no válido`);
    }

    const q = texto(query, 'q', 120);
    const ubicacion = texto(query, 'ubicacion', 100);
    const orden = texto(query, 'orden', 20) ?? 'recientes';
    const estado = texto(query, 'estado_conservacion', 20);
    const precio_min = precio(query, 'precio_min');
    const precio_max = precio(query, 'precio_max');

    if (q && q.split(/\s+/).length > 10) throw new Error('La búsqueda tiene demasiadas palabras');
    if (!ORDENES.includes(orden)) throw new Error('El orden no es válido');
    if (estado !== undefined && !ESTADOS.includes(estado)) {
        throw new Error('El estado de conservación no es válido');
    }
    if (precio_min !== undefined && precio_max !== undefined && precio_min > precio_max) {
        throw new Error('El precio mínimo no puede superar al máximo');
    }

    const filtros = {
        orden,
        pagina: entero(query, 'pagina', 1, 1000000),
        por_pagina: entero(query, 'por_pagina', 12, 48)
    };
    if (q) filtros.q = q;
    if (ubicacion) filtros.ubicacion = ubicacion;
    if (estado) filtros.estado_conservacion = estado;
    if (precio_min !== undefined) filtros.precio_min = precio_min;
    if (precio_max !== undefined) filtros.precio_max = precio_max;
    for (const campo of ['id_categoria', 'id_vendedor']) {
        const valor = entero(query, campo, undefined);
        if (valor !== undefined) filtros[campo] = valor;
    }
    return filtros;
}

// GET /api/articulos
export const buscarArticulos = async (req, res, next) => {
    let filtros;
    try {
        filtros = validarFiltros(req.query);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    try {
        const resultado = await BusquedaModel.buscar(filtros);
        res.json(resultado);
    } catch (error) {
        next(error);
    }
};
