import { Router } from "express";
import { pool } from "../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Crear el router para tickets
const ticketRouter = Router();

// Obtener el nombre del archivo y el directorio de forma equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para log de IP
ticketRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Middleware para la carga de archivos
ticketRouter.use(fileUpload({
    createParentPath: true
}));

// Definir el directorio para almacenar videos e imágenes cargados
const videoDirectory = path.join(__dirname, "../uploads/videos");
const imageDirectory = path.join(__dirname, "../uploads/images");

// Asegurarse de que los directorios existan
if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory, { recursive: true });
}

if (!fs.existsSync(imageDirectory)) {
    fs.mkdirSync(imageDirectory, { recursive: true });
}

// Obtener todos los tickets
ticketRouter.get("/tickets/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM tickets");
        console.log("Tickets retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving tickets:", error);
        return res.status(500).json({ error: 'Error retrieving tickets' });
    }
});

// Crear un nuevo ticket con carga de video e imagen
ticketRouter.post("/create", async (req, res) => {
    try {
        const { ticket_title, user_id, status, relatedto, ticket_description } = req.body;

        let videoFilename = null;
        let imageFilename = null;

        // Verificar si se ha cargado un archivo de video
        if (req.files && req.files.video) {
            let videoFile = req.files.video;
            videoFilename = `${Date.now()}_${videoFile.name}`;
            let videoPath = path.join(videoDirectory, videoFilename);

            // Mover el archivo de video al directorio designado
            await videoFile.mv(videoPath);
        }

        // Verificar si se ha cargado un archivo de imagen
        if (req.files && req.files.image) {
            let imageFile = req.files.image;
            imageFilename = `${Date.now()}_${imageFile.name}`;
            let imagePath = path.join(imageDirectory, imageFilename);

            // Mover el archivo de imagen al directorio designado
            await imageFile.mv(imagePath);
        }

        const newTicket = {
            ticket_title,
            status: status || "open",
            ticket_description: ticket_description || 'No description provided',
            relatedto: relatedto,
            user_id: user_id || 1,
            video_path: videoFilename ? `/uploads/videos/${videoFilename}` : null, // Guardar la ruta del video en la base de datos
            file_path: imageFilename ? `/uploads/images/${imageFilename}` : null // Guardar la ruta de la imagen en la base de datos
        };

        if (!newTicket.ticket_title || !newTicket.user_id) {
            return res.status(400).send("Please provide all required ticket data.");
        }

        const result = await pool.query("INSERT INTO tickets SET ?", [newTicket]);
        res.json({ created: true, ticketId: result.insertId });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).send(error.message);
    }
});

export default ticketRouter;