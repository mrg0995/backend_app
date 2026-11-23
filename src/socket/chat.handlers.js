import EVENTS from './events.js';

/**
 * Eventos del chat de un usuario conectado.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerChatHandlers(io, socket) {
    console.log(`Socket conectado: ${socket.usuario.nombre_usuario}`);

    socket.on(EVENTS.DISCONNECT, () => {
        console.log(`Socket desconectado: ${socket.usuario.nombre_usuario}`);
    });
}