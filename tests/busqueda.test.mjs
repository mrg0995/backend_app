import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Simula MySQL para comprobar la consulta sin necesitar una base de datos instalada.
const llamadas = [];
globalThis.__poolBusquedaPrueba = {
    query: async (sql, params) => {
        llamadas.push({ sql, params });
        if (sql.startsWith('SELECT COUNT')) return [[{ total: 13 }]];
        return [[{
            id: 1, titulo: 'Anillo de plata', precio: '45.00', estado_conservacion: 'como_nuevo',
            estado: 'publicado', ubicacion: 'Madrid', foto_portada: '/uploads/seed-anillo.jpg',
            vendedor_id: 5, vendedor_nombre: 'ana_joyas'
        }]];
    }
};

async function importarCodigo(fichero, importarOriginal, reemplazar) {
    const texto = readFileSync(join(process.cwd(), fichero), 'utf8');
    const codigo = texto.replace(importarOriginal, reemplazar);
    assert.notEqual(codigo, texto, `No se encontró el import en ${fichero}`);
    return import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64'));
}

const modelo = await importarCodigo(
    'src/models/busqueda.model.js',
    "import pool from '../config/db.js';",
    'const pool = globalThis.__poolBusquedaPrueba;'
);
globalThis.__modeloBusquedaPrueba = modelo;
const controlador = await importarCodigo(
    'src/controllers/busqueda.controller.js',
    "import * as BusquedaModel from '../models/busqueda.model.js';",
    'const BusquedaModel = globalThis.__modeloBusquedaPrueba;'
);

const parsear = controlador.validarFiltros;

test('valores por defecto y filtros válidos', () => {
    assert.deepEqual(parsear({}), { orden: 'recientes', pagina: 1, por_pagina: 12 });
    assert.deepEqual(parsear({ q: ' anillos ', por_pagina: '5', precio_min: '0' }), {
        orden: 'recientes', pagina: 1, por_pagina: 5, q: 'anillos', precio_min: 0
    });
});

test('400 para filtros inválidos', () => {
    for (const q of [
        { pagina: '0' }, { por_pagina: '49' }, { precio_min: '-1' },
        { precio_max: 'texto' }, { precio_min: '10', precio_max: '2' },
        { orden: 'DROP TABLE articulo' }, { estado_conservacion: 'regular' },
        { id_categoria: '0' }, { id_vendedor: 'a' }, { foo: 'bar' },
        { q: ['anillo', 'collar'] }, { pagina: '1.5' }
    ]) assert.throws(() => parsear(q), Error);
});

test('SQL seguro con plurales, categoría, filtros y paginación', async () => {
    llamadas.length = 0;
    const filtros = parsear({
        q: 'anillos collares', id_categoria: '1', precio_min: '10', precio_max: '100',
        estado_conservacion: 'como_nuevo', ubicacion: 'Madrid', id_vendedor: '5',
        orden: 'precio_asc', pagina: '2', por_pagina: '5'
    });
    const r = await modelo.buscar(filtros);
    assert.equal(llamadas.length, 2);
    const sel = llamadas[1];
    assert.match(sel.sql, /a\.estado = 'publicado'/);
    assert.match(sel.sql, /ORDER BY a\.precio ASC, a\.id DESC/);
    assert.match(sel.sql, /a\.titulo LIKE \? OR a\.descripcion LIKE \? OR c\.nombre LIKE \?/);
    assert.match(sel.sql, /LIMIT \? OFFSET \?/);
    assert.deepEqual(sel.params.slice(0, 6), [
        '%anillo%', '%anillo%', '%anillo%', '%collar%', '%collar%', '%collar%'
    ]);
    assert.deepEqual(sel.params.slice(-8), [1, 10, 100, 'como_nuevo', '%Madrid%', 5, 5, 5]);
    assert.equal(r.total, 13);
    assert.equal(r.pagina, 2);
    assert.equal(r.por_pagina, 5);
    assert.equal(r.articulos[0].precio, 45);
    assert.equal(r.articulos[0].vendedor.nombre_usuario, 'ana_joyas');
});

test('valores del usuario quedan en parámetros, no en SQL', async () => {
    llamadas.length = 0;
    await modelo.buscar(parsear({ q: "anillos%' OR 1=1 --", orden: 'recientes' }));
    assert.ok(!llamadas[1].sql.includes('1=1'));
    assert.ok(llamadas[1].params.some((p) => String(p).includes('1=1')));
});


test('el controller responde 400 a una petición inválida', async () => {
    let status = 0;
    let cuerpo;
    const res = {
        status(codigo) { status = codigo; return this; },
        json(json) { cuerpo = json; return this; }
    };
    await controlador.buscarArticulos({ query: { por_pagina: '100' } }, res, () => {});
    assert.equal(status, 400);
    assert.match(cuerpo.message, /por_pagina/);
});

test('el controller devuelve el formato esperado por Angular', async () => {
    let cuerpo;
    const res = { json(json) { cuerpo = json; return this; } };
    await controlador.buscarArticulos({ query: { q: 'anillos' } }, res, () => {});
    assert.equal(cuerpo.pagina, 1);
    assert.equal(cuerpo.por_pagina, 12);
    assert.equal(cuerpo.total, 13);
    assert.equal(typeof cuerpo.articulos[0].precio, 'number');
});
