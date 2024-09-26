import { Router } from "express";
import { pool } from "../../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Crear el router para tickets
const ticketRouter = Router();

// Obtener el nombre del archivo y el directorio de forma equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.resolve(__dirname, "../uploads");

// Middleware para log de IP
ticketRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Middleware para la carga de archivos
ticketRouter.use(fileUpload({
    createParentPath: true
}));

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

ticketRouter.get("/tickets/:id", async (req, res) => {
    try {
        const ticketId = req.params.id;
        const [results] = await pool.query("SELECT * FROM tickets WHERE id = ?", [ticketId]);

        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: "Ticket not found" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// Crear un nuevo ticket con carga de video e imagen
ticketRouter.post("/create", async (req, res) => {
    try {
        const { ticket_title, user_id, ticket_status, ticket_assignedto, ticket_priority, ticket_relatedto, ticket_description } = req.body;

        if (!ticket_title || !user_id) {
            return res.status(400).send("Please provide all required ticket data.");
        } 

        const newTicket = {
            ticket_title: ticket_title, 
            ticket_status: ticket_status || "open",
            ticket_description: ticket_description || 'No description provided',
            ticket_relatedto: ticket_relatedto,
            ticket_assignedto: ticket_assignedto, 
            ticket_priority: ticket_priority || "Baja",
            user_id: user_id || 1
        };

        const result = await pool.query("INSERT INTO tickets SET ?", [newTicket]);
        const ticketId = result[0].insertId;

        // Crear directorios específicos para el ticketId
        const ticketVideoDirectory = path.join(basePath, `tickets/${ticketId}/videos`);
        const ticketImageDirectory = path.join(basePath, `tickets/${ticketId}/images`);


        if (!fs.existsSync(ticketVideoDirectory)) {
            fs.mkdirSync(ticketVideoDirectory, { recursive: true });
        }

        if (!fs.existsSync(ticketImageDirectory)) {
            fs.mkdirSync(ticketImageDirectory, { recursive: true });
        }

        let videoFilename = null;
        let imageFilename = null;

        // Verificar si se ha cargado un archivo de video
        if (req.files && req.files.video) {
            let videoFile = req.files.video;
            videoFilename = `${Date.now()}_${videoFile.name}`;
            let videoPath = path.join(ticketVideoDirectory, videoFilename);

            // Mover el archivo de video al directorio designado
            await videoFile.mv(videoPath);
        }

        // Verificar si se ha cargado un archivo de imagen
        if (req.files && req.files.image) {
            let imageFile = req.files.image;
            imageFilename = `${Date.now()}_${imageFile.name}`;
            let imagePath = path.join(ticketImageDirectory, imageFilename);

            // Mover el archivo de imagen al directorio designado
            await imageFile.mv(imagePath);
        }

        // Actualizar la base de datos con las rutas de los archivos
        const updatedTicket = {
            video_path: videoFilename ? `/uploads/tickets/${ticketId}/videos/${videoFilename}` : null, // Guardar la ruta del video en la base de datos
            file_path: imageFilename ? `/uploads/tickets/${ticketId}/images/${imageFilename}` : null // Guardar la ruta de la imagen en la base de datos
        };

        await pool.query("UPDATE tickets SET ? WHERE id = ?", [updatedTicket, ticketId]);

        res.json({ created: true, ticketId: ticketId });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).send(error.message);
    }
});

// actualizar un ticket
ticketRouter.post("/update/:id", async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { ticket_title, ticket_status, ticket_assignedto, ticket_priority, ticket_relatedto, ticket_description } = req.body;

        if (!ticket_title) {
            return res.status(400).send("Please provide a title for the ticket.");
        }

        const updatedTicket = {
            ticket_title: ticket_title,
            ticket_status: ticket_status || "open",
            ticket_description: ticket_description || 'No description provided',
            ticket_relatedto: ticket_relatedto,
            ticket_assignedto: ticket_assignedto,
            ticket_priority: ticket_priority || "Baja"
        };

        const result = await pool.query("UPDATE tickets SET ? WHERE id = ?", [updatedTicket, ticketId]);
        res.json({ updated: true, ticketId: ticketId });
    } catch (error) {
        console.error("Error updating ticket:", error);
        res.status(500).send(error.message);
    }
});

export default ticketRouter;
