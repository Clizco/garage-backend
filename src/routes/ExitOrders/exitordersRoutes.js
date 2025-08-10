import { Router } from "express";
import { pool } from "../../db.js";

const exitOrdersRouter = Router();

// Utilidad para convertir 12h (AM/PM) a 24h HH:MM:SS
function convertTo24Hour(time12h) {
  if (!time12h) return null;
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

// Obtener todas las órdenes de salida
exitOrdersRouter.get("/exit-orders/all", async (_, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT eo.*, 
             v.placa, 
             d.driver_name, 
             d.driver_lastname, 
             c.client_name
      FROM exit_orders eo
      JOIN vehicles v ON eo.vehicle_id = v.id
      JOIN drivers d ON eo.driver_id = d.id
      JOIN clients c ON eo.client_id = c.id
      ORDER BY eo.created_at DESC
    `);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener órdenes de salida" });
  }
});

// Obtener por ID
exitOrdersRouter.get("/exit-orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query(`
      SELECT eo.*, 
             v.placa, 
             d.driver_name, 
             d.driver_lastname, 
             c.client_name
      FROM exit_orders eo
      JOIN vehicles v ON eo.vehicle_id = v.id
      JOIN drivers d ON eo.driver_id = d.id
      JOIN clients c ON eo.client_id = c.id
      WHERE eo.id = ?
    `, [id]);

    if (results.length === 0) return res.status(404).json({ message: "Orden de salida no encontrada" });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la orden de salida" });
  }
});

// Crear orden
exitOrdersRouter.post("/exit-orders/create", async (req, res) => {
  const { vehicle_id, driver_id, client_id, exit_date, entry_date, exit_time, entry_time, exit_reason } = req.body;

  if (!vehicle_id || !driver_id || !client_id || !exit_date || !entry_date || !exit_time || !entry_time) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  const exitTime24 = convertTo24Hour(exit_time);
  const entryTime24 = convertTo24Hour(entry_time);

  try {
    const [result] = await pool.query(
      `INSERT INTO exit_orders (vehicle_id, driver_id, client_id, exit_date, entry_date, exit_time, entry_time, exit_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicle_id, driver_id, client_id, exit_date, entry_date, exitTime24, entryTime24, exit_reason || null]
    );

    res.status(201).json({ message: "Orden de salida creada correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la orden de salida" });
  }
});

// Actualizar orden
exitOrdersRouter.put("/exit-orders/update/:id", async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, driver_id, client_id, exit_date, entry_date, exit_time, entry_time, exit_reason } = req.body;

  if (!vehicle_id || !driver_id || !client_id || !exit_date || !entry_date || !exit_time || !entry_time) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  const exitTime24 = convertTo24Hour(exit_time);
  const entryTime24 = convertTo24Hour(entry_time);

  try {
    await pool.query(
      `UPDATE exit_orders 
       SET vehicle_id = ?, driver_id = ?, client_id = ?, 
           exit_date = ?, entry_date = ?, exit_time = ?, entry_time = ?, exit_reason = ?
       WHERE id = ?`,
      [vehicle_id, driver_id, client_id, exit_date, entry_date, exitTime24, entryTime24, exit_reason || null, id]
    );

    res.json({ message: "Orden de salida actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la orden de salida" });
  }
});

// Eliminar orden
exitOrdersRouter.delete("/exit-orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM exit_orders WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Orden no encontrada" });
    res.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la orden" });
  }
});

export default exitOrdersRouter;
