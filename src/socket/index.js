import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import usuariosModel from '../models/usuarios.model.js';
import EVENTS from './events.js';
import { registerChatHandlers } from './chat.handlers.js';

/** Servidor de socket.io. Se crea en iniciarSocket y lo usa emitirAUsuario. */
let io;

/** Cada usuario tiene su sala, con todas sus conexiones (una por pestaña). */
const salaUsuario = (idUsuario) => `usuario:${idUsuario}`;

/**
 * Crea el servidor de socket.io encima del servidor HTTP de Express (mismo puerto).
 * Solo deja conectarse a quien manda un token válido, y mete cada conexión en la sala de su usuario.
 *
 * @param {import('node:http').Server} server
 */
export const iniciarSocket = (server) => {
    io = new Server(server, {cors: { origin: 'http://localhost:4200' }});

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Debes iniciar sesión'));
        }

        let datosToken;
        try {
            datosToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return next(new Error('La sesión no es válida o ha caducado'));
        }

        try {
            const usuario = await usuariosModel.selectById(datosToken.id);
            if (!usuario || usuario.bloqueado || usuario.eliminado) {
                return next(new Error('Usuario no válido'));
            }
            socket.usuario = usuario;
            next();
        } catch (error) {
            next(error);
        }
    });

    io.on(EVENTS.CONNECTION, (socket) => {
        socket.join(salaUsuario(socket.usuario.id));
        registerChatHandlers(io, socket);
    });
};

/**
 * Envía un evento a todas las conexiones de un usuario.
 *
 * @param {number} idUsuario
 * @param {string} evento - Uno de los EVENTS
 * @param {any} datos
 */
export const emitirAUsuario = (idUsuario, evento, datos) => {
    io.to(salaUsuario(idUsuario)).emit(evento, datos);
};