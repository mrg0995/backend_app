import EVENTS from './events.js';
import { emitirAUsuario } from './index.js';
import conversacionesModel from '../models/conversaciones.model.js';
import mensajesModel from '../models/mensajes.model.js';

/** Máximo de caracteres de un mensaje (docs/api.md) */
const MAX_TEXTO = 1000;

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

    /**
     * mensaje_enviar { id_conversacion, texto }
     * Bien: guarda el mensaje y lo envía con mensaje_nuevo a los dos participantes (también a quien lo envía).
     * Mal: error_mensaje { message, id_conversacion } solo a este socket.
     */
    socket.on(EVENTS.MENSAJE_ENVIAR, async (datos) => {
        const idConversacion = Number(datos?.id_conversacion);
        const texto = typeof datos?.texto === 'string' ? datos.texto.trim() : '';

        // Responde el error solo a quien ha enviado el mensaje
        const error = (message) => socket.emit(EVENTS.ERROR_MENSAJE, { message, id_conversacion: datos?.id_conversacion ?? null });

        if (texto === '') {
            return error('El mensaje está vacío');
        }
        if (texto.length > MAX_TEXTO) {
            return error(`El mensaje no puede tener más de ${MAX_TEXTO} caracteres`);
        }

        try {
            const conversacion = Number.isInteger(idConversacion) ? await conversacionesModel.selectById(idConversacion) : null;
            if (!conversacion) {
                return error('La conversación no existe');
            }

            const idEmisor = socket.usuario.id;
            if (conversacion.id_comprador !== idEmisor && conversacion.id_vendedor !== idEmisor) {
                return error('No participas en esta conversación');
            }

            const result = await mensajesModel.insert(conversacion.id, idEmisor, texto);
            const mensaje = await mensajesModel.selectById(result.insertId);

            emitirAUsuario(conversacion.id_comprador, EVENTS.MENSAJE_NUEVO, mensaje);
            emitirAUsuario(conversacion.id_vendedor, EVENTS.MENSAJE_NUEVO, mensaje);

            // Primer mensaje de la conversación: aviso al otro participante.
            // NOTIFICACIÓN: hacer cuando esté crearNotificacion de Mariel (src/socket/notificaciones.js)
            
        } catch (err) {
            console.error(err);
            error('No se ha podido enviar el mensaje');
        }
    });
}