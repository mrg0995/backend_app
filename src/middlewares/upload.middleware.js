import multer from 'multer';
import crypto from 'node:crypto';

/** Tipos de imagen admitidos y la extensión con la que se guarda cada uno. */
const EXTENSIONES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

/** Tamaño máximo de cada imagen: 2 MB. */
const TAMANO_MAXIMO = 2 * 1024 * 1024;

/**
 * Dónde y con qué nombre se guardan las imágenes.
 * El nombre es único (fecha + código aleatorio) para que dos fotos nunca se pisen,
 * y la extensión sale del tipo de archivo, no del nombre original.
 */
const almacenamiento = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`);
    }
});

/**
 * Deja pasar solo imágenes JPG, PNG o WEBP.
 * Si el archivo es de otro tipo, se rechaza con un error de código TIPO_NO_PERMITIDO.
 */
const filtroImagenes = (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) {
        return cb(null, true);
    }
    const error = new Error('Solo se admiten imágenes JPG, PNG o WEBP');
    error.code = 'TIPO_NO_PERMITIDO';
    cb(error);
};

/**
 * Instancia de multer configurada para imágenes.
 * Se exporta para reutilizarla en el sprint 2 con las fotos de los artículos,
 * por ejemplo con upload.array('fotos', 5).
 */
export const upload = multer({
    storage: almacenamiento,
    fileFilter: filtroImagenes,
    limits: { fileSize: TAMANO_MAXIMO }
});

/**
 * Recibe una sola imagen en el campo indicado y la guarda en uploads/.
 * Si todo va bien, deja el archivo en req.file. Si no llega ninguno, req.file queda vacío
 * y es el controller quien decide si es obligatorio.
 *
 * Ejemplo: router.put('/perfil/foto', checkToken, subirImagen('foto'), updateFoto);
 *
 * Respuestas:
 * - 400: el archivo no es una imagen permitida, pesa más de 2 MB o llega en un campo distinto
 *
 * @param {string} campo - Nombre del campo del formulario que trae la imagen.
 * @returns {import('express').RequestHandler}
 */
export const subirImagen = (campo) => {
    return (req, res, next) => {
        upload.single(campo)(req, res, (error) => {
            if (!error) {
                return next();
            }
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'La imagen no puede pesar más de 2 MB' });
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: `La imagen debe enviarse en el campo "${campo}"` });
            }
            if (error.code === 'TIPO_NO_PERMITIDO') {
                return res.status(400).json({ message: error.message });
            }
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ message: `Error al subir la imagen: ${error.message}` });
            }
            next(error);
        });
    };
};