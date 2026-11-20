import * as ArticulosModel from '../models/articulos.model.js';

export const checkArticuloDueno = async (req, res, next) => {
    try {
        const idArticulo = Number(req.params.idArticulo);
        if (!Number.isInteger(idArticulo) || idArticulo <= 0) {
            return res.status(400).json({ message: 'El id del artículo no es válido' });
        }

        const articulo = await ArticulosModel.selectById(idArticulo);
        if (!articulo) {
            return res.status(404).json({ message: 'El artículo no existe' });
        }

        const idUsuarioLogueado = req.usuario.id;

        if (articulo.vendedor.id !== idUsuarioLogueado) {
            return res.status(403).json({ message: 'El artículo no es tuyo' });
        }

        req.articulo = articulo;
        next();
    } catch (error) {
        next(error);
    }
};
