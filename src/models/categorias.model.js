import pool from '../config/db.js';

export const selectAll = async () => {
    const [rows] = await pool.query(
        'SELECT id, nombre FROM categoria ORDER BY id ASC'
    );
    return rows;
};

export const selectById = async (id) => {
    const [rows] = await pool.query(
        'SELECT id, nombre FROM categoria WHERE id = ?',
        [id]
    );
    return rows[0] || null;
};