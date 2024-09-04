import { Router } from "express";
import { pool } from "../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Crear el router para propiedades
const propertyRouter = Router();

// Obtener el nombre del archivo y el directorio de forma equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para log de IP
propertyRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Middleware para la carga de archivos
propertyRouter.use(fileUpload({
    createParentPath: true
}));

// Obtener todas las propiedades
propertyRouter.get("/properties/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM properties");
        console.log("Properties retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving properties:", error);
        return res.status(500).json({ error: 'Error retrieving properties' });
    }
});

// Crear una nueva propiedad con carga de fotos y documentos
propertyRouter.post("/create", async (req, res) => {
    try {
        const {
            property_name,
            property_country,
            property_province,
            property_city,
            property_address,
            property_relationship,
            users_id
        } = req.body;

        if (!property_name || !users_id) {
            return res.status(400).send("Please provide all required property data.");
        }

        const newProperty = {
            property_name,
            property_country,
            property_province,
            property_city,
            property_address,
            property_relationship: property_relationship || null,
            users_id: users_id || 1
        };

        // Insertar la nueva propiedad en la base de datos
        const [result] = await pool.query("INSERT INTO properties SET ?", [newProperty]);

        const propertyId = result.insertId;

        // Crear un directorio único para la propiedad recién creada
        const propertyDirectory = path.join(__dirname, `../uploads/properties/${propertyId}`);
        const photoDirectory = path.join(propertyDirectory, "photos");
        const documentDirectory = path.join(propertyDirectory, "documents");

        // Crear los directorios de la propiedad, fotos y documentos
        fs.mkdirSync(photoDirectory, { recursive: true });
        fs.mkdirSync(documentDirectory, { recursive: true });

        let photoFilename = null;
        let documentFilename = null;

        // Verificar si se ha cargado un archivo de foto
        if (req.files && req.files.photo) {
            let photoFile = req.files.photo;
            photoFilename = `${Date.now()}_${photoFile.name}`;
            let photoPath = path.join(photoDirectory, photoFilename);

            // Mover el archivo de foto al directorio designado
            await photoFile.mv(photoPath);
        }

        // Verificar si se ha cargado un archivo de documento
        if (req.files && req.files.document) {
            let documentFile = req.files.document;
            documentFilename = `${Date.now()}_${documentFile.name}`;
            let documentPath = path.join(documentDirectory, documentFilename);

            // Mover el archivo de documento al directorio designado
            await documentFile.mv(documentPath);
        }

        // Actualizar la propiedad con las rutas de archivo
        const updateProperty = {
            file_path: photoFilename ? `/uploads/properties/${propertyId}/photos/${photoFilename}` : null,
            document_path: documentFilename ? `/uploads/properties/${propertyId}/documents/${documentFilename}` : null
        };

        await pool.query("UPDATE properties SET ? WHERE id = ?", [updateProperty, propertyId]);

        res.json({ created: true, propertyId });
    } catch (error) {
        console.error("Error creating property:", error);
        res.status(500).send(error.message);
    }
});

export default propertyRouter;
