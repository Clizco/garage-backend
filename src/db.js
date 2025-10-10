import { createPool } from 'mysql2/promise';

export const pool = createPool({
    host: "178.128.72.192",
    user: "koli_user",
    password: "Aa123456*7!",
    port : 3306, 
    database: "koli",
    timezone: "-05:00" // ← importante para forzar hora de Panamá
});