import { Router } from "express";
import { pool } from "../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Crear el router para legal
const legalRouter = Router();

// Obtener el nombre del archivo y el directorio de forma equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para log de IP
legalRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Middleware para la carga de archivos
legalRouter.use(fileUpload({
    createParentPath: true
}));

// Obtener todos los registros legales
legalRouter.get("/legal/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM legal");
        console.log("Legal records retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving legal records:", error);
        return res.status(500).json({ error: 'Error retrieving legal records' });
    }
});

// Crear un nuevo registro legal con carga de documentos
legalRouter.post("/legal/create", async (req, res) => {
    try {
        const { legal_name, legal_nif, legal_country, legal_province, legal_city, legal_address, users_id } = req.body;

        // Validar los campos requeridos
        if (!legal_name || !legal_nif || !users_id) {
            return res.status(400).send("Please provide all required legal data.");
        }

        const newLegalRecord = {
            legal_name: legal_name,
            legal_nif: legal_nif,
            legal_country: legal_country,
            legal_province: legal_province,
            legal_city: legal_city,
            legal_address: legal_address,
            users_id: users_id
        };

        const result = await pool.query("INSERT INTO legal SET ?", [newLegalRecord]);
        const legalId = result[0].insertId;

        // Crear directorio específico para el legalId
        const legalFilesDirectory = path.join(__dirname, `../uploads/legal/${legalId}`);

        if (!fs.existsSync(legalFilesDirectory)) {
            fs.mkdirSync(legalFilesDirectory, { recursive: true });
        }

        let documentFilename = null;
        let fileFilename = null;

        // Verificar si se ha cargado un archivo de documento
        if (req.files) {
            // Manejar Pacto Social
            if (req.files.document_path) {
                let documentFile = req.files.document_path;
                documentFilename = `${Date.now()}_${documentFile.name}`;
                let documentPath = path.join(legalFilesDirectory, documentFilename);

                // Mover el archivo de documento al directorio designado
                await documentFile.mv(documentPath);
            }

            // Manejar Aviso de Operaciones
            if (req.files.file_path) {
                let fileFile = req.files.file_path;
                fileFilename = `${Date.now()}_${fileFile.name}`;
                let filePath = path.join(legalFilesDirectory, fileFilename);

                // Mover el archivo del aviso de operaciones al directorio designado
                await fileFile.mv(filePath);
            }
        }

        // Actualizar la base de datos con las rutas de los documentos
        const updatedLegalRecord = {
            document_path: documentFilename ? `/uploads/legal/${legalId}/${documentFilename}` : null,
            file_path: fileFilename ? `/uploads/legal/${legalId}/${fileFilename}` : null,
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        await pool.query("UPDATE legal SET ? WHERE id = ?", [updatedLegalRecord, legalId]);

        res.json({ created: true, legalId: legalId });
    } catch (error) {
        console.error("Error creating legal record:", error);
        res.status(500).send(error.message);
    }
});

export default legalRouter;
