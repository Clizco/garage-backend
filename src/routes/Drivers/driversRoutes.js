import { Router } from "express";
import { pool } from "../../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const driversRouter = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/drivers/tmp";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'));
    }
    cb(null, true);
  }
});

// Obtener todos los conductores
driversRouter.get("/drivers/all", async (_, res) => {
  try {
    const [drivers] = await pool.query("SELECT * FROM drivers");
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
});

// Obtener conductor por ID
driversRouter.get("/drivers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM drivers WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Conductor no encontrado" });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener conductor" });
  }
});

// Crear conductor
driversRouter.post("/drivers/create", upload.fields([
  { name: 'driver_license_file', maxCount: 1 },
  { name: 'driver_identification_file', maxCount: 1 }
]), async (req, res) => {
  const {
    driver_name,
    driver_lastname,
    driver_identification_type,
    driver_identification,
    driver_email,
    driver_phone,
    driver_license_type,
    driver_nationality,
    driver_birthdate,
    driver_license_issue_date,
    driver_license_expiration_date,
    driver_control_number
  } = req.body;

  if (
    !driver_name || !driver_lastname || !driver_identification_type ||
    !driver_identification || !driver_email || !driver_phone ||
    !driver_license_type || !driver_nationality ||
    !driver_birthdate || !driver_license_issue_date || !driver_license_expiration_date ||
    !driver_control_number || !req.files?.driver_license_file || !req.files?.driver_identification_file
  ) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO drivers (
        driver_name, driver_lastname, driver_identification_type, driver_identification,
        driver_email, driver_phone, driver_license_type, driver_nationality,
        driver_birthdate, driver_license_issue_date, driver_license_expiration_date, driver_control_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        driver_name, driver_lastname, driver_identification_type, driver_identification,
        driver_email, driver_phone, driver_license_type, driver_nationality,
        driver_birthdate, driver_license_issue_date, driver_license_expiration_date, driver_control_number
      ]
    );

    const driverId = result.insertId;
    const driverDir = `uploads/drivers/${driverId}`;
    fs.mkdirSync(driverDir, { recursive: true });

    const licenseFile = req.files.driver_license_file[0];
    const licensePath = `${driverDir}/license.pdf`;
    fs.renameSync(licenseFile.path, licensePath);

    const idFile = req.files.driver_identification_file[0];
    const idPath = `${driverDir}/identification.pdf`;
    fs.renameSync(idFile.path, idPath);

    await pool.query(
      `UPDATE drivers SET driver_license_file = ?, driver_identification_file = ? WHERE id = ?`,
      [licensePath, idPath, driverId]
    );

    res.status(201).json({ message: "Conductor creado correctamente", id: driverId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Identificación, correo, teléfono, tipo o control ya existen" });
    }
    res.status(500).json({ message: "Error al crear el conductor" });
  }
});

// Actualizar conductor
driversRouter.put("/drivers/update/:id", upload.fields([
  { name: 'driver_license_file', maxCount: 1 },
  { name: 'driver_identification_file', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const {
    driver_name,
    driver_lastname,
    driver_identification_type,
    driver_identification,
    driver_email,
    driver_phone,
    driver_license_type,
    driver_nationality,
    driver_birthdate,
    driver_license_issue_date,
    driver_license_expiration_date,
    driver_control_number
  } = req.body;

  if (
    !driver_name || !driver_lastname || !driver_identification_type ||
    !driver_identification || !driver_email || !driver_phone ||
    !driver_license_type || !driver_nationality ||
    !driver_birthdate || !driver_license_issue_date || !driver_license_expiration_date ||
    !driver_control_number
  ) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    await pool.query(
      `UPDATE drivers SET
        driver_name = ?, driver_lastname = ?, driver_identification_type = ?, driver_identification = ?,
        driver_email = ?, driver_phone = ?, driver_license_type = ?,
        driver_nationality = ?, driver_birthdate = ?, driver_license_issue_date = ?,
        driver_license_expiration_date = ?, driver_control_number = ?
      WHERE id = ?`,
      [
        driver_name, driver_lastname, driver_identification_type, driver_identification,
        driver_email, driver_phone, driver_license_type,
        driver_nationality, driver_birthdate, driver_license_issue_date,
        driver_license_expiration_date, driver_control_number, id
      ]
    );

    const driverDir = `uploads/drivers/${id}`;
    fs.mkdirSync(driverDir, { recursive: true });

    if (req.files.driver_license_file) {
      const licenseFile = req.files.driver_license_file[0];
      const licensePath = `${driverDir}/license.pdf`;
      fs.renameSync(licenseFile.path, licensePath);
      await pool.query(`UPDATE drivers SET driver_license_file = ? WHERE id = ?`, [licensePath, id]);
    }

    if (req.files.driver_identification_file) {
      const idFile = req.files.driver_identification_file[0];
      const idPath = `${driverDir}/identification.pdf`;
      fs.renameSync(idFile.path, idPath);
      await pool.query(`UPDATE drivers SET driver_identification_file = ? WHERE id = ?`, [idPath, id]);
    }

    res.json({ message: "Conductor actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el conductor" });
  }
});

// Eliminar conductor
driversRouter.delete("/drivers/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM drivers WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }

    res.json({ message: "Conductor eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el conductor" });
  }
});

export default driversRouter;
