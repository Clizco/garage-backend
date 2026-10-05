import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carga el .env de la raíz del proyecto sin importar desde dónde se arranque el proceso
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
}

const config = { secret: process.env.JWT_SECRET };

export const port = process.env.PORT || 3004;
export default config;
