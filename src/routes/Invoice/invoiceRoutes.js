import { Router } from "express";
import { pool } from "../../db.js";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Crear el router para facturas
const invoiceRouter = Router();

// Obtener el nombre del archivo y el directorio de forma equivalente a __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para log de IP
invoiceRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Middleware para la carga de archivos
invoiceRouter.use(fileUpload({
    createParentPath: true
}));

// Obtener todas las facturas
invoiceRouter.get("/invoices/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM invoices");
        console.log("Invoices retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving invoices:", error);
        return res.status(500).json({ error: 'Error retrieving invoices' });
    }
});

// Crear una nueva factura con carga de imagen
invoiceRouter.post("/invoices/create", async (req, res) => {
    try {
        const { invoice_number, invoice_date, invoice_due_date, invoice_total, user_id, invoice_relationship, invoice_status, invoice_description } = req.body;

        if (!invoice_number || !user_id) {
            return res.status(400).send("Please provide all required invoice data.");
        } 

        const newInvoice = {
            invoice_number: invoice_number,
            invoice_date: invoice_date,
            invoice_due_date: invoice_due_date,
            invoice_total: invoice_total || 0,
            invoice_status: invoice_status || "PENDIENTE",
            invoice_relationship: invoice_relationship || null,
            invoice_description: invoice_description || 'No description provided',
            users_id: user_id || 1
        };

        const result = await pool.query("INSERT INTO invoices SET ?", [newInvoice]);
        const invoiceId = result[0].insertId;

        // Crear directorio específico para el invoiceId
        const invoiceImageDirectory = path.join(__dirname, `../uploads/invoices/${invoiceId}/images`);

        if (!fs.existsSync(invoiceImageDirectory)) {
            fs.mkdirSync(invoiceImageDirectory, { recursive: true });
        }

        let imageFilename = null;

        // Verificar si se ha cargado un archivo de imagen
        if (req.files && req.files.image) {
            let imageFile = req.files.image;
            imageFilename = `${Date.now()}_${imageFile.name}`;
            let imagePath = path.join(invoiceImageDirectory, imageFilename);

            // Mover el archivo de imagen al directorio designado
            await imageFile.mv(imagePath);
        }

        // Actualizar la base de datos con la ruta de la imagen
        const updatedInvoice = {
            file_path: imageFilename ? `/uploads/invoices/${invoiceId}/images/${imageFilename}` : null // Guardar la ruta de la imagen en la base de datos
        };

        await pool.query("UPDATE invoices SET ? WHERE id = ?", [updatedInvoice, invoiceId]);

        res.json({ created: true, invoiceId: invoiceId });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).send(error.message);
    }
});

export default invoiceRouter;
