/**
 * Prueba de enviar mensajes por socket. Necesita el back arrancado y el seed recién cargado.
 * usuario@test.com escribe a ana_joyas sobre el artículo 1, ana responde y se prueban los errores.
 * Uso: node scripts/prueba-mensajes.mjs
 */
import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

const login = async (email) => {
    const respuesta = await fetch(`${URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: '12345678' })
    });
    return (await respuesta.json()).token;
};

/** Conecta y enseña por consola todo lo que le llega */
const conectar = (nombre, token) => new Promise((resolve) => {
    const socket = io(URL, { auth: { token }, reconnection: false });
    socket.on('mensaje_nuevo', (m) => console.log(`   ${nombre} recibe mensaje_nuevo: #${m.id} «${m.texto}»`));
    socket.on('error_mensaje', (e) => console.log(`   ${nombre} recibe error_mensaje: ${e.message}`));
    socket.on('connect', () => resolve(socket));
});

/** Envía y espera un poco a que lleguen las respuestas */
const enviar = async (titulo, socket, datos) => {
    console.log(titulo);
    socket.emit('mensaje_enviar', datos);
    await new Promise((resolve) => setTimeout(resolve, 300));
};

const tokenUsuario = await login('usuario@test.com');
const tokenAna = await login('ana.joyas@test.com');
const tokenLuis = await login('luis.joyas@test.com');

// Abrir (o recuperar) la conversación de usuario con ana sobre el artículo 1
const respuesta = await fetch(`${URL}/api/conversaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUsuario}` },
    body: JSON.stringify({ id_articulo: 1 })
});
const conversacion = await respuesta.json();

const usuario = await conectar('usuario', tokenUsuario);
const ana = await conectar('ana', tokenAna);
const luis = await conectar('luis', tokenLuis);

await enviar('1. usuario escribe (les llega a los dos)', usuario, { id_conversacion: conversacion.id, texto: 'Hola, ¿sigue disponible?' });
await enviar('2. ana responde', ana, { id_conversacion: conversacion.id, texto: 'Sí, claro' });
await enviar('3. Mensaje vacío (error)', usuario, { id_conversacion: conversacion.id, texto: '   ' });
await enviar('4. Más de 1000 caracteres (error)', usuario, { id_conversacion: conversacion.id, texto: 'x'.repeat(1001) });
await enviar('5. Conversación que no existe (error)', usuario, { id_conversacion: 9999, texto: 'Hola' });
await enviar('6. luis no participa (error, a nadie más le llega nada)', luis, { id_conversacion: conversacion.id, texto: 'Hola' });

[usuario, ana, luis].forEach((socket) => socket.disconnect());