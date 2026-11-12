import jwt from 'jsonwebtoken';
import usuariosModel from '../models/usuarios.model.js';

/**
 * Comprueba que la petición trae un token válido y carga el usuario en req.usuario.
 * Se pone delante de cualquier ruta que necesite haber iniciado sesión.
 *
 * Cabecera esperada: Authorization: Bearer <token>
 *
 * Respuestas:
 * - 401: no hay token, el token no es válido o ha caducado, o el usuario ya no existe o está bloqueado
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const checkToken = async (req, res, next) => {
    const cabecera = req.headers.authorization;
    if (!cabecera || !cabecera.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Debes iniciar sesión para acceder a esta ruta' });
    }

    const token = cabecera.split(' ')[1];

    let datosToken;
    try {
        datosToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'La sesión ha expirado' });
    }

    const usuario = await usuariosModel.selectById(datosToken.id);
    if (!usuario || usuario.bloqueado || usuario.eliminado) {
        return res.status(401).json({ message: 'Usuario no válido' });
    }

    req.usuario = usuario;
    next();
}
/**
 * Deja pasar solo a los usuarios con alguno de los roles indicados.
 * Va siempre DESPUÉS de checkToken, porque usa req.usuario.
 *
 * Ejemplo: router.get('/reportes', checkToken, checkRole('moderador', 'administrador'), getReportes);
 *
 * Respuestas:
 * - 403: el usuario no tiene ninguno de esos roles
 *
 * @param {...('usuario'|'moderador'|'administrador')} roles - Roles que tienen permiso.
 * @returns {import('express').RequestHandler}
 */
export const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({ message: 'No tienes permisos para acceder a esta ruta' });
        }
        next();
    };
}
