import { Router } from "express";
import { pool } from "../../db.js";

const vehicleInspectionRouter = Router();

// Crear una inspección de entrada o salida
vehicleInspectionRouter.post("/", async (req, res) => {
  try {
    const {
      vehicle_id,
      tipo, // "entrada" o "salida"
      kilometraje,
      nivel_combustible,
      accesorios,
      luces_sistemas,
      observaciones
    } = req.body;

    if (!vehicle_id || !tipo || !nivel_combustible) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Generar fecha y hora actual del sistema
    const ahora = new Date();
    const fecha = ahora.toISOString().split("T")[0]; // YYYY-MM-DD
    const hora = ahora.toTimeString().split(" ")[0]; // HH:MM:SS

    const [result] = await pool.query(
      `INSERT INTO vehicle_inspections (
        vehicle_id, tipo, fecha, hora, kilometraje,
        nivel_combustible, accesorios, luces_sistemas, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_id,
        tipo,
        fecha,
        hora,
        kilometraje || null,
        nivel_combustible,
        JSON.stringify(accesorios || {}),
        JSON.stringify(luces_sistemas || {}),
        observaciones || null
      ]
    );

    res.status(201).json({
      message: "Inspección registrada correctamente",
      id: result.insertId,
      fecha,
      hora
    });
  } catch (error) {
    console.error("Error al registrar inspección:", error);
    res.status(500).json({ message: "Error interno al registrar inspección" });
  }
});


// Obtener todas las inspecciones de un vehículo
vehicleInspectionRouter.get("/by-vehicle/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    const [inspections] = await pool.query(
      "SELECT * FROM vehicle_inspections WHERE vehicle_id = ? ORDER BY fecha DESC, hora DESC",
      [vehicle_id]
    );
    res.json(inspections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener inspecciones" });
  }
});

// Obtener todas las inspecciones del sistema
vehicleInspectionRouter.get("/all", async (req, res) => {
  try {
    const [inspections] = await pool.query(
      "SELECT * FROM vehicle_inspections ORDER BY fecha DESC, hora DESC"
    );
    res.json(inspections);
  } catch (error) {
    console.error("Error al obtener inspecciones:", error);
    res.status(500).json({ message: "Error al obtener inspecciones" });
  }
});

// Eliminar una inspección por ID
vehicleInspectionRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM vehicle_inspections WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inspección no encontrada" });
    }

    res.json({ message: "Inspección eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar inspección:", error);
    res.status(500).json({ message: "Error al eliminar inspección" });
  }
});

export default vehicleInspectionRouter;
