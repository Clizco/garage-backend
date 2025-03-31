import { Router } from "express";
import { pool } from "../../db.js";

const provincesRouter = Router();

// Middleware para registrar la IP
provincesRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Obtener todas las provincias
provincesRouter.get("/provinces/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM provinces");
        console.log("Provincias obtenidas:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener provincias:", error);
        return res.status(500).json({ error: 'Error al obtener provincias' });
    }
});

// Crear una nueva provincia
provincesRouter.post("/create", async (req, res) => {
    try {
        const { province_name } = req.body;

        if (!province_name) {
            return res.status(400).send("Por favor, proporciona el nombre de la provincia.");
        }

        const newProvince = { province_name };
        const result = await pool.query("INSERT INTO provinces SET ?", [newProvince]);
        const provinceId = result[0].insertId;

        return res.status(200).json({ message: "Provincia creada exitosamente", provinceId });
    } catch (error) {
        console.error("Error al crear provincia:", error);
        return res.status(500).json({ error: 'Error al crear provincia' });
    }
});

// Actualizar una provincia
provincesRouter.put("/update/:id", async (req, res) => {
    try {
        const { province_name } = req.body;
        const { id } = req.params;

        if (!province_name) {
            return res.status(400).send("Por favor, proporciona el nombre de la provincia.");
        }

        const updatedProvince = { province_name };
        await pool.query("UPDATE provinces SET ? WHERE id = ?", [updatedProvince, id]);

        return res.status(200).json({ message: "Provincia actualizada exitosamente" });
    } catch (error) {
        console.error("Error al actualizar provincia:", error);
        return res.status(500).json({ error: 'Error al actualizar provincia' });
    }
});

// Eliminar una provincia
provincesRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM provinces WHERE id = ?", [id]);
        return res.status(200).json({ message: "Provincia eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar provincia:", error);
        return res.status(500).json({ error: 'Error al eliminar provincia' });
    }
});

export default provincesRouter;
