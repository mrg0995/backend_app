import * as ArticulosModel from '../models/articulos.model.js';
import * as CategoriasModel from '../models/categorias.model.js';
import UsuariosModel from '../models/usuarios.model.js';

const ESTADOS_CONSERVACION_VALIDOS = ['nuevo', 'como_nuevo', 'buen_estado', 'aceptable'];

const validarDatosArticulo = async (body) => {
    const { titulo, descripcion, precio, id_categoria, estado_conservacion } = body;

    if (
        !titulo || typeof titulo !== 'string' || titulo.trim() === '' ||
        !descripcion || typeof descripcion !== 'string' || descripcion.trim() === '' ||
        precio === undefined || precio === null || precio === '' ||
        !id_categoria || !estado_conservacion
    ) {
        return 'Faltan campos obligatorios';
    }

    if (titulo.trim().length > 120) {
        return 'El título no puede superar los 120 caracteres';
    }

    const precioNum = Number(precio);
    if (Number.isNaN(precioNum) || precioNum < 0) {
        return 'El precio debe ser un número mayor o igual a 0';
    }

    if (!ESTADOS_CONSERVACION_VALIDOS.includes(estado_conservacion)) {
        return 'El estado de conservación no es válido';
    }

    const categoriaIdNum = Number(id_categoria);
    if (!Number.isInteger(categoriaIdNum) || categoriaIdNum <= 0) {
        return 'La categoría no es válida';
    }

    const categoria = await CategoriasModel.selectById(categoriaIdNum);
    if (!categoria) {
        return 'La categoría no existe';
    }

    return null;
};

// GET /api/articulos/:idArticulo (solo publicados y vendidos)
export const getByIdPublico = async (req, res, next) => {
    try {
        const idArticulo = Number(req.params.idArticulo);
        if (!Number.isInteger(idArticulo) || idArticulo <= 0) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        const articulo = await ArticulosModel.selectById(idArticulo);
        if (!articulo || !['publicado', 'vendido'].includes(articulo.estado)) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        res.json(articulo);
    } catch (error) {
        next(error);
    }
};

// POST /api/articulos
export const create = async (req, res, next) => {
    try {
        const errorValidacion = await validarDatosArticulo(req.body);
        if (errorValidacion) {
            return res.status(400).json({ message: errorValidacion });
        }

        const idUsuario = req.user?.id ?? req.usuario?.id;
        let ubicacion = req.body.ubicacion?.trim() || null;

        // Si no llega ubicación, usamos la del perfil del usuario
        if (!ubicacion) {
            const usuario = await UsuariosModel.selectById(idUsuario);
            ubicacion = usuario?.ubicacion || null;
        }

        const nuevoId = await ArticulosModel.insert({
            id_usuario: idUsuario,
            id_categoria: Number(req.body.id_categoria),
            titulo: req.body.titulo.trim(),
            descripcion: req.body.descripcion.trim(),
            precio: Number(req.body.precio),
            estado_conservacion: req.body.estado_conservacion,
            ubicacion
        });

        const articuloCreado = await ArticulosModel.selectById(nuevoId);
        res.status(201).json(articuloCreado);
    } catch (error) {
        next(error);
    }
};

// PUT /api/articulos/:idArticulo (usa checkArticuloDueno -> req.articulo)
export const update = async (req, res, next) => {
    try {
        if (!['borrador', 'publicado'].includes(req.articulo.estado)) {
            return res.status(409).json({
                message: 'Solo se pueden editar artículos en borrador o publicados'
            });
        }

        const errorValidacion = await validarDatosArticulo(req.body);
        if (errorValidacion) {
            return res.status(400).json({ message: errorValidacion });
        }

        const ubicacion = req.body.ubicacion !== undefined
            ? (req.body.ubicacion?.trim() || null)
            : req.articulo.ubicacion;

        await ArticulosModel.update(req.articulo.id, {
            id_categoria: Number(req.body.id_categoria),
            titulo: req.body.titulo.trim(),
            descripcion: req.body.descripcion.trim(),
            precio: Number(req.body.precio),
            estado_conservacion: req.body.estado_conservacion,
            ubicacion
        });

        const articuloActualizado = await ArticulosModel.selectById(req.articulo.id);
        res.json(articuloActualizado);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/articulos/:idArticulo (usa checkArticuloDueno -> req.articulo)
export const remove = async (req, res, next) => {
    try {
        if (req.articulo.estado === 'en_revision') {
            return res.status(409).json({
                message: 'El artículo está en revisión y no se puede borrar'
            });
        }

        await ArticulosModel.deleteById(req.articulo.id);
        res.json({ message: 'Artículo borrado' });
    } catch (error) {
        // Error 1451 de MySQL (ER_ROW_IS_REFERENCED_2): tiene reportes asociados
        if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'El artículo tiene reportes y no se puede borrar'
            });
        }
        next(error);
    }
};

// PATCH /api/articulos/:idArticulo/publicar (usa checkArticuloDueno -> req.articulo)
export const publicar = async (req, res, next) => {
    try {
        if (req.articulo.estado !== 'borrador') {
            return res.status(409).json({
                message: 'Solo se pueden publicar artículos que estén en borrador'
            });
        }

        if (!req.articulo.fotos || req.articulo.fotos.length === 0) {
            return res.status(409).json({
                message: 'El artículo debe tener al menos una foto para publicarse'
            });
        }

        await ArticulosModel.updateEstado(req.articulo.id, 'publicado');
        const articuloPublicado = await ArticulosModel.selectById(req.articulo.id);
        res.json(articuloPublicado);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/articulos/:idArticulo/vendido (usa checkArticuloDueno -> req.articulo)
export const marcarVendido = async (req, res, next) => {
    try {
        if (req.articulo.estado !== 'publicado') {
            return res.status(409).json({
                message: 'Solo se pueden marcar como vendidos los artículos publicados'
            });
        }

        await ArticulosModel.updateEstado(req.articulo.id, 'vendido');
        const articuloVendido = await ArticulosModel.selectById(req.articulo.id);
        res.json(articuloVendido);
    } catch (error) {
        next(error);
    }
};

// GET /api/usuarios/perfil/articulos (registrada en usuarios.routes.js)
export const getMisArticulos = async (req, res, next) => {
    try {
        const idUsuario = req.user?.id ?? req.usuario?.id;
        const articulos = await ArticulosModel.selectByUsuario(idUsuario);
        res.json(articulos);
    } catch (error) {
        next(error);
    }
};

// GET /api/usuarios/perfil/articulos/:idArticulo (registrada en usuarios.routes.js, usa checkArticuloDueno)
export const getMiArticuloById = async (req, res, next) => {
    try {
        res.json(req.articulo);
    } catch (error) {
        next(error);
    }
};