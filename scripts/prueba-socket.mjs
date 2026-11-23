/**
 * Prueba del servidor de sockets. Necesita el back arrancado y el seed cargado.
 * Uso: node scripts/prueba-socket.mjs
 */
import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

/** Conecta con un token y dice si ha podido o por qué no */
const conectar = (nombre, token) => new Promise((resolve) => {
    const socket = io(URL, { auth: { token }, reconnection: false });
    socket.on('connect', () => {
        console.log(`✓ ${nombre}: conectado`);
        resolve(socket);
    });
    socket.on('connect_error', (error) => {
        console.log(`✗ ${nombre}: ${error.message}`);
        resolve(null);
    });
});

const respuesta = await fetch(`${URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'usuario@test.com', password: '12345678' })
});
const { token } = await respuesta.json();

const bien = await conectar('Con el token de usuario@test.com', token);
await conectar('Sin token', undefined);
await conectar('Con un token inventado', 'abc.def.ghi');

bien?.disconnect();