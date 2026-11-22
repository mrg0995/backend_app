import fs from 'node:fs/promises';
import path from 'node:path';
import fotosModel from '../models/fotos.model.js';

/** Máximo de fotos por artículo. */
const MAX_FOTOS = 5;

/**
 * Borra un archivo del disco. Si no existe no hace nada; si falla por otro motivo
 * lo apunta en la consola y sigue, para no romper la petición.
 * @param {string} ruta - Ruta del archivo, por ejemplo 'uploads/123.jpg'.
 */
const borrarArchivo = async (ruta) => {
    try {
        await fs.unlink(ruta);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('No se pudo borrar el archivo:', error.message);
        }
    }
};

/**
 * Borra de uploads/ las fotos que se acaban de subir en esta petición.
 * Se usa cuando la petición se rechaza después de que multer las haya guardado.
 * @param {Express.Multer.File[]} archivos
 */
const borrarSubidas = async (archivos) => {
    await Promise.all(archivos.map((archivo) => borrarArchivo(archivo.path)));
};

/**
 * Sube una o varias fotos a un artículo. Se colocan detrás de las que ya tiene;
 * si no tenía ninguna, la primera queda como portada (posición 0).
 * El id y el dueño del artículo los comprueba checkArticuloDueno antes de guardar nada.
 * Las imágenes las ha guardado subirImagenes('fotos', 10) en uploads/ y las deja en req.files.
 *
 * POST /api/fotos/articulo/:idArticulo
 * Body: multipart/form-data con uno o varios archivos en el campo "fotos"
 *
 * Respuestas:
 * - 201: array con todas las fotos del artículo
 * - 400: no llega ninguna imagen (el resto de los 400, 403 y 404 los responde checkArticuloDueno)
 * - 409: el artículo superaría las 5 fotos
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const subirFotos = async (req, res) => {
    const archivos = req.files ?? [];
    const idArticulo = Number(req.params.idArticulo);

    if (archivos.length === 0) {
        return res.status(400).json({ message: 'No llega ninguna imagen en el campo fotos' });
    }

    const actuales = await fotosModel.countByArticulo(idArticulo);
    if (actuales + archivos.length > MAX_FOTOS) {
        await borrarSubidas(archivos);
        return res.status(409).json({ message: `Un artículo no puede tener más de ${MAX_FOTOS} fotos` });
    }

    try {
        for (let i = 0; i < archivos.length; i++) {
            await fotosModel.insert(idArticulo, `/uploads/${archivos[i].filename}`, actuales + i);
        }
    } catch (error) {
        await borrarSubidas(archivos);
        throw error;
    }

    const fotos = await fotosModel.selectByArticulo(idArticulo);
    res.status(201).json(fotos);
};

/**
 * Borra una foto. Si era la portada, la siguiente pasa a serlo.
 * También borra el archivo de uploads/.
 *
 * DELETE /api/fotos/:idFoto
 *
 * Respuestas:
 * - 200: array con las fotos que le quedan al artículo
 * - 400: el id no es un número
 * - 403: la foto es de un artículo que no es tuyo
 * - 404: la foto no existe
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const borrarFoto = async (req, res) => {
    const idFoto = Number(req.params.idFoto);

    if (!Number.isInteger(idFoto) || idFoto <= 0) {
        return res.status(400).json({ message: 'El id de la foto no es válido' });
    }

    const foto = await fotosModel.selectById(idFoto);
    if (!foto) {
        return res.status(404).json({ message: 'Foto no encontrada' });
    }

    if (foto.id_usuario !== req.usuario.id) {
        return res.status(403).json({ message: 'Esta foto es de un artículo que no es tuyo' });
    }

    await fotosModel.deleteById(idFoto);
    await fotosModel.moverPosiciones(foto.id_articulo, foto.posicion);

    if (foto.url.startsWith('/uploads/')) {
        await borrarArchivo(path.join('uploads', path.basename(foto.url)));
    }

    const fotos = await fotosModel.selectByArticulo(foto.id_articulo);
    res.json(fotos);
};
