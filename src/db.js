import { createPool } from 'mysql2/promise';
import "./config.js"; // carga las variables de entorno

export const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    timezone: process.env.DB_TIMEZONE || "-05:00" // ← importante para forzar hora de Panamá
});
