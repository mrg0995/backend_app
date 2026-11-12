import usuariosModel from '../models/usuarios.model.js';
import { datosUsuario } from './auth.controller.js';



/**
 * Devuelve los datos públicos de un usuario: nombre, foto y ubicación.
 * Nunca devuelve el email.
 *
 * GET /api/usuarios/:idUsuario/publico
 *
 * Respuestas:
 * - 200: { id, nombre_usuario, foto_url, ubicacion }
 * - 400: el id no es un número
 * - 404: el usuario no existe o está eliminado
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getPerfilPublico = async (req, res) => {
    const idUsuario = Number(req.params.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({ message: 'El id de usuario no es válido' });
    }

    const usuario = await usuariosModel.selectById(idUsuario);
    if (!usuario || usuario.eliminado) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { id, nombre_usuario, foto_url, ubicacion } = usuario;
    res.json({ id, nombre_usuario, foto_url, ubicacion });
};

/**
 * Devuelve los datos del usuario que ha iniciado sesión.
 * El usuario lo deja checkToken en req.usuario.
 *
 * GET /api/usuarios/perfil
 *
 * Respuestas:
 * - 200: { id, nombre_usuario, email, rol, foto_url, ubicacion }
 * - 401: lo responde checkToken si no hay token, ha caducado o el usuario está bloqueado
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getPerfil = (req, res) => {
    res.json(datosUsuario(req.usuario));
};

/**
 * Edita el nombre de usuario y/o la ubicación del usuario que ha iniciado sesión.
 * El campo que no se envíe se queda como estaba.
 *
 * PUT /api/usuarios/perfil
 * Body: { nombre_usuario?, ubicacion? }
 *
 * Respuestas:
 * - 200: { message, usuario }
 * - 400: no llega ningún campo o el nombre de usuario está vacío
 * - 409: el nombre de usuario ya lo tiene otra persona
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updatePerfil = async (req, res) => {
    const { nombre_usuario, ubicacion } = req.body ?? {};

    if (nombre_usuario === undefined && ubicacion === undefined) {
        return res.status(400).json({ message: 'Envía al menos un campo: nombre_usuario o ubicacion' });
    }

    let nuevoNombre = req.usuario.nombre_usuario;
    if (nombre_usuario !== undefined) {
        if (typeof nombre_usuario !== 'string' || nombre_usuario.trim() === '') {
            return res.status(400).json({ message: 'El nombre de usuario no puede estar vacío' });
        }
        nuevoNombre = nombre_usuario.trim();

        const existente = await usuariosModel.selectByNombreUsuario(nuevoNombre);
        if (existente && existente.id !== req.usuario.id) {
            return res.status(409).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
        }
    }

    let nuevaUbicacion = req.usuario.ubicacion;
    if (ubicacion !== undefined) {
        nuevaUbicacion = typeof ubicacion === 'string' && ubicacion.trim() !== '' ? ubicacion.trim() : null;
    }

    await usuariosModel.update(req.usuario.id, { nombre_usuario: nuevoNombre, ubicacion: nuevaUbicacion });
    const usuario = await usuariosModel.selectById(req.usuario.id);

    res.json({ message: 'Perfil actualizado', usuario: datosUsuario(usuario) });
};


/**
 * Cambia la foto de perfil del usuario que ha iniciado sesión.
 * La imagen ya la ha guardado subirImagen('foto') en uploads/ y la deja en req.file.
 *
 * PUT /api/usuarios/perfil/foto
 * Body: multipart/form-data con un campo "foto"
 *
 * Respuestas:
 * - 200: { message, usuario }
 * - 400: no llega ninguna imagen (los demás 400 los responde subirImagen)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateFoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No llega ninguna imagen en el campo foto' });
    }

    const foto_url = `/uploads/${req.file.filename}`;
    await usuariosModel.updateFoto(req.usuario.id, foto_url);
    const usuario = await usuariosModel.selectById(req.usuario.id);

    res.json({ message: 'Foto actualizada', usuario: datosUsuario(usuario) });
};