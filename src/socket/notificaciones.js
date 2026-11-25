import notificacionesModel from '../models/notificaciones.model.js';
import conversacionesModel from '../models/conversaciones.model.js';
import EVENTS from './events.js';
import { emitirAUsuario } from './index.js';

/**
 * Crea una notificación: la guarda en la base de datos y se la envía al usuario en tiempo real
 * con el evento notificacion_nueva (llega a todas sus pestañas abiertas).
 *
 * Es la única forma de crear avisos en todo el back. La usan:
 * - Conversaciones: en el primer mensaje, al vendedor (tipo 'mensaje').
 * - Artículos: al marcar como vendido, a los compradores con conversación (tipo 'cambio_estado').
 * - Moderación (sprint 4): al dueño del artículo (tipo 'moderacion').
 *
 * Si el envío por socket falla, la notificación ya está guardada: el usuario la verá al cargar
 * sus notificaciones, así que el error solo se apunta en la consola.
 *
 * @param {number} idUsuario - A quién va dirigida
 * @param {'mensaje'|'cambio_estado'|'moderacion'} tipo
 * @param {string} texto - Lo que se enseña, por ejemplo: «Anillo de plata» se ha vendido
 * @param {string|null} [enlace=null] - Ruta del front a la que lleva, por ejemplo '/mensajes/12'
 * @returns {Promise<object>} La notificación creada, con el formato del contrato
 */
export const crearNotificacion = async (idUsuario, tipo, texto, enlace = null) => {
    const id = await notificacionesModel.insert(idUsuario, tipo, texto, enlace);
    const { id_usuario, ...notificacion } = await notificacionesModel.selectById(id);

    try {
        emitirAUsuario(idUsuario, EVENTS.NOTIFICACION_NUEVA, notificacion);
    } catch (error) {
        console.error('No se pudo enviar la notificación por socket:', error.message);
    }

    return notificacion;
};

/**
 * Avisa de que un artículo se ha vendido a todos los compradores que tenían una
 * conversación sobre él (tipo 'cambio_estado', con enlace al detalle del artículo).
 *
 * Se llama desde marcarVendido (articulos.controller.js) después de cambiar el estado.
 * Si algo falla, solo se apunta en la consola: el artículo ya está vendido y la
 * respuesta al vendedor no debe fallar por un aviso.
 *
 * @param {{id: number, titulo: string}} articulo - El artículo que se acaba de vender
 * @returns {Promise<number>} Cuántos compradores han recibido el aviso
 */
export const notificarArticuloVendido = async (articulo) => {
    try {
        const compradores = await conversacionesModel.selectCompradoresByArticulo(articulo.id);
        for (const idComprador of compradores) {
            await crearNotificacion(
                idComprador,
                'cambio_estado',
                `«${articulo.titulo}» se ha vendido`,
                `/articulos/${articulo.id}`
            );
        }
        return compradores.length;
    } catch (error) {
        console.error('No se pudo avisar de la venta:', error.message);
        return 0;
    }
};
