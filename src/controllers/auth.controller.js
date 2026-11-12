import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import usuariosModel from '../models/usuarios.model.js';

/**
 * Crea el token JWT de un usuario.
 * Lleva dentro su id y su rol, está firmado con JWT_SECRET y caduca a los 7 días.
 * @param {import('../models/usuarios.model.js').Usuario} usuario - Usuario recién registrado o que inicia sesión.
 * @returns {string} El token, que el front envía después en la cabecera Authorization: Bearer <token>.
 */
const crearToken = (usuario) => {
    return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Se queda solo con los datos del usuario que se pueden enviar al front.
 * Deja fuera password_hash, bloqueado, eliminado y fecha_creacion.
 * @param {import('../models/usuarios.model.js').Usuario} usuario - Usuario completo sacado de la base de datos.
 * @returns {{ id: number, nombre_usuario: string, email: string, rol: string, foto_url: string|null, ubicacion: string|null }}
 */
const datosUsuario = (usuario) => {
    const { id, nombre_usuario, email, rol, foto_url, ubicacion } = usuario;
    return { id, nombre_usuario, email, rol, foto_url, ubicacion };
};

/**
 * Registra un usuario nuevo y le deja la sesión iniciada.
 *
 * POST /api/auth/registro
 * Body: { nombre_usuario, email, password, ubicacion? }
 *
 * Respuestas:
 * - 201: { message, token, usuario }
 * - 400: faltan campos obligatorios o la contraseña no es válida
 * - 409: el email o el nombre de usuario ya existen
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const registro = async (req, res) => {
    const { nombre_usuario, email, password, ubicacion } = req.body;

    if (!nombre_usuario || !email || !password) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: nombre_usuario, email, password' });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres y ser una cadena de texto' });
    }

    if (await usuariosModel.selectByEmail(email)) {
        return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    if (await usuariosModel.selectByNombreUsuario(nombre_usuario)) {
        return res.status(409).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await usuariosModel.insert(nombre_usuario, email, password_hash, ubicacion);
    const usuario = await usuariosModel.selectById(nuevoUsuario.insertId);

    res.status(201).json({
        message: 'Usuario registrado correctamente',
        token: crearToken(usuario),
        usuario: datosUsuario(usuario)
    });
};