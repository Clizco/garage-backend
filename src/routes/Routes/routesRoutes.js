import { Router } from "express";
import { pool } from "../../db.js";

const routesRouter = Router();

// Obtener todas las rutas
routesRouter.get("/routes/all", async (_, res) => {
  try {
    const [routes] = await pool.query(`
      SELECT r.*, v.placa, u.user_firstname AS driver_name, u.user_lastname AS driver_lastname
      FROM routes r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN users u ON r.user_id = u.id
    `);
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las rutas" });
  }
});

// Obtener una ruta por ID
routesRouter.get("/routes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [routes] = await pool.query(`
      SELECT r.*, v.placa, u.user_firstname AS driver_name, u.user_lastname AS driver_lastname
      FROM routes r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    if (routes.length === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    res.json(routes[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la ruta" });
  }
});

// Crear una ruta (solo se crea al iniciar, sin travel_time)
routesRouter.post("/routes/create", async (req, res) => {
  const { vehicle_id, user_id, route_name } = req.body;

  if (!vehicle_id || !user_id || !route_name) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO routes (vehicle_id, user_id, route_name)
      VALUES (?, ?, ?)
    `, [vehicle_id, user_id, route_name]);

    res.status(201).json({
      message: "Ruta creada correctamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la ruta" });
  }
});


// Finalizar ruta (se actualiza travel_time y se marca la hora de finalización)
routesRouter.put("/routes/update/:id", async (req, res) => {
  const { id } = req.params;
  const { travel_time } = req.body;

  if (!travel_time) {
    return res.status(400).json({ message: "El tiempo de viaje es obligatorio" });
  }

  try {
    const [result] = await pool.query(`
      UPDATE routes 
      SET travel_time = ?, end_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [travel_time, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    res.json({ message: "Ruta finalizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al finalizar la ruta" });
  }
});

// Finalizar ruta (actualiza end_at si no fue calculado antes)
routesRouter.patch("/routes/end/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(`
      UPDATE routes 
      SET end_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    res.json({ message: "Ruta finalizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al finalizar la ruta" });
  }
});

// Eliminar una ruta
routesRouter.delete("/routes/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM routes WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    res.json({ message: "Ruta eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la ruta" });
  }
});

// Obtener rutas por vehículo
routesRouter.get("/routes/vehicle/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    const [routes] = await pool.query(`
      SELECT r.*, v.placa, u.user_firstname AS driver_name, u.user_lastname AS driver_lastname
      FROM routes r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN users u ON r.user_id = u.id
      WHERE r.vehicle_id = ?
    `, [vehicle_id]);

    if (routes.length === 0) {
      return res.status(404).json({ message: "No se encontraron rutas para este vehículo" });
    }

    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener rutas por vehículo" });
  }
});

// Obtener rutas por conductor
routesRouter.get("/routes/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [routes] = await pool.query(`
      SELECT r.*, v.placa, u.user_firstname AS driver_name, u.user_lastname AS driver_lastname
      FROM routes r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
    `, [user_id]);

    if (routes.length === 0) {
      return res.status(404).json({ message: "No se encontraron rutas para este usuario" });
    }

    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener rutas por usuario" });
  }
});

export default routesRouter;
