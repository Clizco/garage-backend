import { Router } from "express";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js";

const reportRouter = Router();

// Middleware que registra la IP
reportRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Crear un nuevo reporte
reportRouter.post("/create/", async (req, res) => {
    try {
        const newReport = {
            report_title: req.body.report_title,
            report_description: req.body.report_description,
            report_relatedto: req.body.report_relatedto,
            user_id: req.body.user_id,
        };

        // Verifica que todos los datos sean proporcionados
        if (!newReport.report_title || !newReport.report_description || !newReport.user_id) {
            return res.status(400).send("Por favor ingrese todos los datos requeridos del reporte");
        }

        const token = jwt.sign({ id: newReport.user_id }, config.secret, {
            expiresIn: 60 * 60 * 24,
        });

        const result = await pool.query("INSERT INTO reports SET ?", [newReport]);

        res.json({ auth: true, result, token });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Traer todos los reportes
reportRouter.get("/reports/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, created_at, report_title, report_description, report_relatedto, user_id, updated_at FROM reports"
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Traer un reporte por ID
reportRouter.get("/reports/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [results] = await pool.query(
            "SELECT id, created_at, report_title, report_description, report_relatedto, user_id, updated_at FROM reports WHERE id = ?",
            [id]
        );

        if (results.length === 0) {
            return res.status(404).send("Reporte no encontrado");
        }

        return res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Eliminar un reporte por ID
reportRouter.delete("/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query("DELETE FROM reports WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).send("Reporte no encontrado");
        }

        res.json({ message: "Reporte eliminado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

export default reportRouter;
