import { Router } from "express";
import { pool } from "../../db.js";

const workshopReportRouter = Router();

// Obtener todos los reportes del taller
workshopReportRouter.get("/workshop-reports/all", async (_, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT r.*, v.placa, v.marca, v.modelo 
      FROM workshop_reports r 
      JOIN vehicles v ON r.vehicle_id = v.id
    `);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener reportes del taller" });
  }
});

// Obtener un reporte del taller por ID
workshopReportRouter.get("/workshop-reports/reports/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [reports] = await pool.query(`
      SELECT r.*, v.placa, v.marca, v.modelo
      FROM workshop_reports r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ?
    `, [id]);
    if (reports.length === 0) {
      return res.status(404).json({ message: "Reporte del taller no encontrado" });
    }
    res.json(reports[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener reporte del taller" });
  }
});

// Obtener reportes por vehículo
workshopReportRouter.get("/workshop-reports/vehicle/:vehicle_id", async (req, res) => {
  const { vehicle_id } = req.params;
  try {
    const [reports] = await pool.query(`
      SELECT * FROM workshop_reports WHERE vehicle_id = ?
    `, [vehicle_id]);

    if (reports.length === 0) {
      return res.status(404).json({ message: "No se encontraron reportes para este vehículo" });
    }

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener reportes del taller" });
  }
});

// Crear un reporte del taller
workshopReportRouter.post("/workshop-reports/create", async (req, res) => {
  const { vehicle_id, report_date, report_time, report_details, report_part_details } = req.body;

  if (!vehicle_id || !report_date || !report_time || !report_details || !report_part_details) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    await pool.query(`
      INSERT INTO workshop_reports (vehicle_id, report_date, report_time, report_details, report_part_details)
      VALUES (?, ?, ?, ?, ?)
    `, [vehicle_id, report_date, report_time, report_details, report_part_details]);

    res.status(201).json({ message: "Reporte del taller creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el reporte del taller" });
  }
});

// Eliminar un reporte del taller
workshopReportRouter.delete("/workshop-reports/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM workshop_reports WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reporte del taller no encontrado" });
    }

    res.json({ message: "Reporte del taller eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el reporte del taller" });
  }
});

// Actualizar un reporte del taller
workshopReportRouter.put("/workshop-reports/update/:id", async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, report_date, report_time, report_details, report_part_details } = req.body;

  if (!vehicle_id || !report_date || !report_time || !report_details || !report_part_details) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const [result] = await pool.query(`
      UPDATE workshop_reports 
      SET vehicle_id = ?, report_date = ?, report_time = ?, report_details = ?, report_part_details = ?
      WHERE id = ?
    `, [vehicle_id, report_date, report_time, report_details, report_part_details, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reporte del taller no encontrado" });
    }

    res.json({ message: "Reporte del taller actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el reporte del taller" });
  }
});

export default workshopReportRouter;
