import { Router } from "express";
import { pool } from "../../db.js";

const observationsRouter = Router();

// Util: leer userId desde header x-user-id (en GET/PUT/DELETE)
function getUserIdFromHeader(req) {
  const v = req.headers["x-user-id"];
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Obtener todas las observaciones con info del usuario
observationsRouter.get("/observations/all", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.user_firstname, u.user_lastname, u.user_email
      FROM observations o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las observaciones" });
  }
});

// Obtener "mis" observaciones (user_id desde header x-user-id)
observationsRouter.get("/observations/my", async (req, res) => {
  try {
    const userId = getUserIdFromHeader(req);
    if (!userId) return res.status(400).json({ message: "Falta header x-user-id" });

    const [rows] = await pool.query(
      `
      SELECT o.*, u.user_firstname, u.user_lastname, u.user_email
      FROM observations o
      JOIN users u ON u.id = o.user_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener mis observaciones" });
  }
});

// Obtener observaciones por usuario específico (admin u otros usos)
observationsRouter.get("/observations/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT o.*, u.user_firstname, u.user_lastname, u.user_email
      FROM observations o
      JOIN users u ON u.id = o.user_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las observaciones del usuario" });
  }
});

// Obtener una observación por ID
observationsRouter.get("/observations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT o.*, u.user_firstname, u.user_lastname, u.user_email
      FROM observations o
      JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Observación no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la observación" });
  }
});

// Crear una observación (user_id viene del BODY enviado por el front)
observationsRouter.post("/observations/create", async (req, res) => {
  const {
    user_id, // <-- obligatorio desde el front (decodedToken)
    destination,
    person_fullname,
    identification_type,
    person_identification,
    vehicle_type,
    vehicle_license_plate,
    vehicle_brand,
    vehicle_color,
    observation_text
  } = req.body;

  if (!Number.isFinite(Number(user_id))) {
    return res.status(400).json({ message: "user_id inválido o ausente" });
  }

  if (
    !destination || !person_fullname || !identification_type || !person_identification ||
    !vehicle_type || !vehicle_license_plate || !vehicle_brand || !vehicle_color
  ) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO observations (
        user_id, destination, person_fullname, identification_type,
        person_identification, vehicle_type, vehicle_license_plate,
        vehicle_brand, vehicle_color, observation_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(user_id),
        destination,
        person_fullname,
        identification_type,
        person_identification,
        vehicle_type,
        vehicle_license_plate,
        vehicle_brand,
        vehicle_color,
        observation_text || null
      ]
    );

    res.status(201).json({
      message: "Observación creada correctamente",
      id: result.insertId,
      user_id: Number(user_id)
    });
  } catch (error) {
    console.error(error);
    // Si tienes FK: ER_NO_REFERENCED_ROW_2
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "user_id no existe en users" });
    }
    res.status(500).json({ message: "Error al crear la observación" });
  }
});

// Actualizar una observación (verifica que el dueño sea quien edita vía x-user-id)
observationsRouter.put("/observations/update/:id", async (req, res) => {
  const { id } = req.params;
  const editorId = getUserIdFromHeader(req); // dueño desde header
  if (!editorId) return res.status(400).json({ message: "Falta header x-user-id" });

  const {
    destination,
    person_fullname,
    identification_type,
    person_identification,
    vehicle_type,
    vehicle_license_plate,
    vehicle_brand,
    vehicle_color,
    observation_text
  } = req.body;

  try {
    // Verificar propietario
    const [own] = await pool.query(`SELECT user_id FROM observations WHERE id = ?`, [id]);
    if (own.length === 0) return res.status(404).json({ message: "Observación no encontrada" });
    if (own[0].user_id !== editorId) {
      return res.status(403).json({ message: "No tienes permiso para editar esta observación" });
    }

    const [result] = await pool.query(
      `
      UPDATE observations
      SET destination = ?, person_fullname = ?, identification_type = ?,
          person_identification = ?, vehicle_type = ?, vehicle_license_plate = ?,
          vehicle_brand = ?, vehicle_color = ?, observation_text = ?
      WHERE id = ?
      `,
      [
        destination, person_fullname, identification_type, person_identification,
        vehicle_type, vehicle_license_plate, vehicle_brand, vehicle_color,
        observation_text || null, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Observación no encontrada" });
    }
    res.json({ message: "Observación actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la observación" });
  }
});

// Eliminar una observación (verifica dueño vía x-user-id)
observationsRouter.delete("/observations/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM observations WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Observación no encontrada" });
    }
    res.json({ message: "Observación eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la observación" });
  }
});

export default observationsRouter;
