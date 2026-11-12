import usuariosModel from '../models/usuarios.model.js';

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