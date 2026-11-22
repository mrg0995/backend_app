import { readFileSync } from 'node:fs';

// Prueba real de punta a punta contra el backend local y una BD de pruebas.
// Necesita schema.sql, seed.sql y el servidor arrancado.
const base = process.env.API_URL_PRUEBA || 'http://localhost:3000/api';
const url = new URL(base);
if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('Por seguridad, la prueba solo admite servidores locales');
}
if (process.env.PRUEBA_SPRINT2 !== 'SI') {
    console.log('Para realizar la prueba con datos reales, ejecuta: PRUEBA_SPRINT2=SI node scripts/prueba-sprint2.mjs');
    process.exit(0);
}

let token;
let idArticulo;

async function peticion(ruta, metodo = 'GET', cuerpo) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined && !(cuerpo instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        cuerpo = JSON.stringify(cuerpo);
    }
    const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers, body: cuerpo });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        throw new Error(`${metodo} ${ruta}: HTTP ${respuesta.status} - ${resultado.message || JSON.stringify(resultado)}`);
    }
    return resultado;
}

function comprobar(ok, texto) {
    if (!ok) throw new Error(`Fallo en la comprobación: ${texto}`);
    console.log('✓', texto);
}

try {
    const login = await peticion('/auth/login', 'POST', {
        email: 'ana.joyas@test.com', password: '12345678'
    });
    token = login.token;
    comprobar(Boolean(token), 'Iniciar sesión con la cuenta del seed');

    const marca = `comprobacion${Date.now()}`;
    const articulo = await peticion('/articulos', 'POST', {
        titulo: `Anillo ${marca}`,
        descripcion: 'Artículo de prueba para el Sprint 2',
        precio: 45,
        id_categoria: 1,
        estado_conservacion: 'como_nuevo',
        ubicacion: 'Madrid'
    });
    idArticulo = articulo.id;
    comprobar(articulo.estado === 'borrador', 'Crear el artículo como borrador');

    const form = new FormData();
    form.append('fotos', new Blob([readFileSync('db/fotos-seed/seed-01.jpg')], { type: 'image/jpeg' }), 'foto-prueba.jpg');
    const fotos = await peticion(`/fotos/articulo/${idArticulo}`, 'POST', form);
    comprobar(Array.isArray(fotos) && fotos.length === 1, 'Subir una foto al artículo');

    const publicado = await peticion(`/articulos/${idArticulo}/publicar`, 'PATCH');
    comprobar(publicado.estado === 'publicado', 'Publicar el artículo');

    const busqueda = await peticion(`/articulos?q=${encodeURIComponent(`anillos ${marca}`)}`);
    comprobar(busqueda.articulos.some((a) => a.id === idArticulo), 'Encontrar el artículo buscando anillos en plural');
    comprobar(busqueda.articulos.every((a) => typeof a.precio === 'number'), 'Precios devueltos como números');

    const detalle = await peticion(`/articulos/${idArticulo}`);
    comprobar(detalle.id === idArticulo && detalle.fotos.length === 1, 'Ver el detalle y la foto');

    const vendido = await peticion(`/articulos/${idArticulo}/vendido`, 'PATCH');
    comprobar(vendido.estado === 'vendido', 'Marcar el artículo como vendido');

    const despues = await peticion(`/articulos?q=${encodeURIComponent(marca)}`);
    comprobar(!despues.articulos.some((a) => a.id === idArticulo), 'El artículo vendido no aparece en la búsqueda');

    await peticion(`/articulos/${idArticulo}`, 'DELETE');
    idArticulo = null;
    comprobar(true, 'Borrar el artículo de prueba');
    console.log('\nPrueba de punta a punta superada.');
} catch (error) {
    console.error('\nError:', error.message);
    if (idArticulo && token) {
        try {
            await peticion(`/articulos/${idArticulo}`, 'DELETE');
            console.log('Se ha borrado el artículo creado durante la prueba.');
        } catch (limpieza) {
            console.error(`Revisa el artículo ${idArticulo}: ${limpieza.message}`);
        }
    }
    process.exitCode = 1;
}
