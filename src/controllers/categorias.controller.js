import * as CategoriasModel from '../models/categorias.model.js';

export const getAll = async (req, res, next) => {
    try {
        const categorias = await CategoriasModel.selectAll();
        res.json(categorias);
    } catch (error) {
        next(error);
    }
};