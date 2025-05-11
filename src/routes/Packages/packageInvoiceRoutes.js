import { Router } from "express";
import { pool } from "../../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const packageInvoicesRouter = Router();

// Configurar multer para manejar la subida de facturas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "./uploads/invoices";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware para registrar la IP
packageInvoicesRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Obtener todas las facturas
packageInvoicesRouter.get("/invoices/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM package_invoices");
        console.log("Facturas obtenidas:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener facturas:", error);
        return res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

// Obtener una factura específica por ID
packageInvoicesRouter.get("/invoices/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM package_invoices WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Factura no encontrada" });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener la factura:", error);
        return res.status(500).json({ error: 'Error al obtener la factura' });
    }
});

// Obtener facturas por paquete
packageInvoicesRouter.get("/invoices/package/:packageId", async (req, res) => {
    try {
        const { packageId } = req.params;
        const [rows] = await pool.query("SELECT * FROM package_invoices WHERE package_id = ?", [packageId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron facturas para este paquete" });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener facturas por paquete:", error);
        return res.status(500).json({ error: 'Error al obtener facturas por paquete' });
    }
});

// Crear una nueva factura con archivo
packageInvoicesRouter.post("/invoices/create", upload.single('invoice'), async (req, res) => {
    try {
        const { package_id, user_id } = req.body;

        if (!package_id || !user_id) {
            return res.status(400).json({ error: "El ID del paquete y del usuario son obligatorios." });
        }

        if (!req.file) {
            return res.status(400).json({ error: "El archivo de la factura es obligatorio." });
        }

        const invoice_path = `/uploads/invoices/${req.file.filename}`;

        await pool.query(
            "INSERT INTO package_invoices SET ?",
            { package_id, invoice_path, user_id }
        );

        return res.status(200).json({ message: "Factura creada exitosamente" });
    } catch (error) {
        console.error("Error al crear factura:", error);
        return res.status(500).json({ error: "Error al crear factura" });
    }
});

// Actualizar una factura (sin nuevo archivo todavía)
packageInvoicesRouter.put("/invoices/update/:id", async (req, res) => {
    try {
        const { package_id, invoice_path, user_id } = req.body;
        const { id } = req.params;

        if (!package_id || !invoice_path || !user_id) {
            return res.status(400).send("Por favor, proporciona todos los datos requeridos para actualizar la factura.");
        }

        const updatedInvoice = {
            package_id,
            invoice_path,
            user_id
        };

        await pool.query("UPDATE package_invoices SET ? WHERE id = ?", [updatedInvoice, id]);

        return res.status(200).json({ message: "Factura actualizada exitosamente" });
    } catch (error) {
        console.error("Error al actualizar factura:", error);
        return res.status(500).json({ error: 'Error al actualizar factura' });
    }
});

// Eliminar una factura
packageInvoicesRouter.delete("/invoices/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM package_invoices WHERE id = ?", [id]);
        return res.status(200).json({ message: "Factura eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar factura:", error);
        return res.status(500).json({ error: 'Error al eliminar factura' });
    }
});

export default packageInvoicesRouter;
