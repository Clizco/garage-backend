import { Router } from "express";
import { pool } from "../../db.js";

const milageRouter = Router();

// Obtener todos los registros de kilometraje
milageRouter.get("/milages/all", async (_, res) => {
  try {
    const [milages] = await pool.query(`
      SELECT m.*, v.placa, v.marca, v.modelo 
      FROM milages m 
      JOIN vehicles v ON m.vehicle_id = v.id
    `);
    res.json(milages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener registros de kilometraje" });
  }
});

// Obtener un registro de kilometraje por ID
milageRouter.get("/milages/milages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [milages] = await pool.query(`
      SELECT m.*, v.placa, v.marca, v.modelo
      FROM milages m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = ?
    `, [id]);
    if (milages.length === 0) {
      return res.status(404).json({ message: "Registro de kilometraje no encontrado"
      });
    }
    res.json(milages[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener registro de kilometraje"
    });
  }
});

// Obtener el último kilometraje de un vehículo
milageRouter.get("/milages/last/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT mileage, date FROM milages WHERE vehicle_id = ? ORDER BY date DESC LIMIT 1`,
      [vehicle_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros de kilometraje para este vehículo" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el último kilometraje" });
  }
});


// Obtener registros de kilometraje por vehículo
milageRouter.get("/milages/vehicle/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    const [milages] = await pool.query(`
      SELECT * FROM milages WHERE vehicle_id = ?
    `, [vehicle_id]);

    if (milages.length === 0) {
      return res.status(404).json({ message: "No se encontraron registros para este vehículo" });
    }

    res.json(milages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener registros de kilometraje" });
  }
});

// Crear un registro de kilometraje
milageRouter.post("/milages/create", async (req, res) => {
  const { vehicle_id, mileage, date } = req.body;

  if (!vehicle_id || !mileage || !date) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (isNaN(parseInt(mileage)) || parseInt(mileage) < 0) {
    return res.status(400).json({ message: "El kilometraje debe ser un número válido y positivo" });
  }

  try {
    await pool.query(`
      INSERT INTO milages (vehicle_id, mileage, date)
      VALUES (?, ?, ?)
    `, [vehicle_id, parseInt(mileage), date]);

    res.status(201).json({ message: "Registro de kilometraje creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear registro de kilometraje" });
  }
});

// Eliminar un registro de kilometraje
milageRouter.delete("/milages/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM milages WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Registro de kilometraje no encontrado" });
    }

    res.json({ message: "Registro de kilometraje eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar registro de kilometraje" });
  }
});

// Actualizar un registro de kilometraje
milageRouter.put("/milages/update/:id", async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, mileage, date } = req.body;

  if (!vehicle_id || !mileage || !date) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (isNaN(parseInt(mileage)) || parseInt(mileage) < 0) {
    return res.status(400).json({ message: "El kilometraje debe ser un número válido y positivo" });
  }

  try {
    const [result] = await pool.query(`
      UPDATE milages SET vehicle_id = ?, mileage = ?, date = ?
      WHERE id = ?
    `, [vehicle_id, parseInt(mileage), date, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Registro de kilometraje no encontrado" });
    }

    res.json({ message: "Registro de kilometraje actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar registro de kilometraje" });
  }
});

export default milageRouter;
