import { Router } from "express";
import { pool } from "../../db.js";

const locationsRouter = Router();

const ensureLocationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      location_name VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

locationsRouter.use(async (_req, _res, next) => {
  try {
    await ensureLocationsTable();
    next();
  } catch (error) {
    next(error);
  }
});

locationsRouter.get("/all", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM locations ORDER BY location_name ASC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener ubicaciones" });
  }
});

locationsRouter.post("/create", async (req, res) => {
  const { location_name } = req.body;
  const cleanName = String(location_name || "").trim();

  if (!cleanName) {
    return res.status(400).json({ message: "El nombre de la ubicación es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO locations (location_name) VALUES (?)",
      [cleanName.toUpperCase()]
    );

    res.status(201).json({ message: "Ubicación creada correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "La ubicación ya existe" });
    }
    res.status(500).json({ message: "Error al crear la ubicación" });
  }
});

locationsRouter.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { location_name } = req.body;
  const cleanName = String(location_name || "").trim();

  if (!cleanName) {
    return res.status(400).json({ message: "El nombre de la ubicación es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE locations SET location_name = ? WHERE id = ?",
      [cleanName.toUpperCase(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ubicación no encontrada" });
    }

    res.json({ message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "La ubicación ya existe" });
    }
    res.status(500).json({ message: "Error al actualizar la ubicación" });
  }
});

locationsRouter.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM locations WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ubicación no encontrada" });
    }

    res.json({ message: "Ubicación eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la ubicación" });
  }
});

// Migrar ubicaciones únicas desde la tabla vehicles
locationsRouter.post("/migrate-from-vehicles", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT ubicacion FROM vehicles WHERE ubicacion IS NOT NULL AND ubicacion != ''"
    );

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = String(row.ubicacion).trim().toUpperCase();
      if (!name) continue;
      try {
        await pool.query(
          "INSERT IGNORE INTO locations (location_name) VALUES (?)",
          [name]
        );
        created++;
      } catch (_) {
        skipped++;
      }
    }

    res.json({
      message: `Migración completa: ${created} ubicacion(es) importadas, ${skipped} omitidas por duplicado.`,
      created,
      skipped,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en la migración" });
  }
});

export default locationsRouter;
