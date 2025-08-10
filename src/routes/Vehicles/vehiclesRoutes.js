import { Router } from "express";
import multer from "multer";
import { pool } from "../../db.js";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

const vehicleRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  }
});

function normalizePrecio(precioStr) {
  return parseFloat(precioStr.replace(/,/g, ""));
}

// Obtener todos los vehículos
vehicleRouter.get("/vehicles/all", async (_, res) => {
  try {
    const [vehicles] = await pool.query("SELECT * FROM vehicles");
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener vehículos" });
  }
});

// Obtener vehículo por ID
vehicleRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Vehículo no encontrado" });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener vehículo" });
  }
});

// Crear vehículo
vehicleRouter.post("/create", upload.single("ruv"), async (req, res) => {
  try {
    const {
      placa,
      vin,
      ubicacion,
      propietario,
      municipio,
      mes_de_placa,
      marca,
      modelo,
      capacidad,
      ton,
      year,
      uso,
      precio
    } = req.body;

    if (
      !placa || !ubicacion || !propietario || !municipio ||
      !mes_de_placa || !marca || !modelo || !capacidad ||
      !ton || !year || !uso || !precio
    ) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const precioNormalizado = normalizePrecio(precio);
    if (isNaN(precioNormalizado) || precioNormalizado <= 0) {
      return res.status(400).json({ message: "El precio debe ser un número positivo válido" });
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles 
       (placa, vin, ubicacion, propietario, municipio, mes_de_placa, marca, modelo, capacidad, ton, year, uso, precio) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        placa,
        vin || null,
        ubicacion,
        propietario,
        municipio,
        mes_de_placa,
        marca,
        modelo,
        parseInt(capacidad),
        parseFloat(ton),
        year,
        uso,
        precioNormalizado
      ]
    );

    const vehicleId = result.insertId;

    if (req.file) {
      const dirPath = path.join("uploads", "vehicles", vehicleId.toString());
      await fs.mkdir(dirPath, { recursive: true });

      const fileName = `ruv_${Date.now()}${path.extname(req.file.originalname)}`;
      const fullPath = path.join(dirPath, fileName);

      await fs.writeFile(fullPath, req.file.buffer);
      await pool.query("UPDATE vehicles SET ruv = ? WHERE id = ?", [fullPath, vehicleId]);
    }

    res.status(201).json({ message: "Vehículo registrado correctamente", id: vehicleId });

  } catch (error) {
    console.error("Error al registrar vehículo:", error);
    res.status(500).json({ message: "Error al registrar vehículo" });
  }
});

// Actualizar vehículo
vehicleRouter.put("/vehicles/update/:id", upload.single("ruv"), async (req, res) => {
  const { id } = req.params;
  const {
    placa,
    vin,
    ubicacion,
    propietario,
    municipio,
    mes_de_placa,
    marca,
    modelo,
    capacidad,
    ton,
    year,
    uso,
    precio
  } = req.body;

  if (
    !placa || !ubicacion || !propietario || !municipio ||
    !mes_de_placa || !marca || !modelo || !capacidad ||
    !ton || !year || !uso || !precio
  ) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const precioNormalizado = normalizePrecio(precio);
  if (isNaN(precioNormalizado) || precioNormalizado <= 0) {
    return res.status(400).json({ message: "El precio debe ser un número positivo" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE vehicles SET 
        placa = ?, 
        vin = ?, 
        ubicacion = ?, 
        propietario = ?, 
        municipio = ?, 
        mes_de_placa = ?, 
        marca = ?, 
        modelo = ?, 
        capacidad = ?, 
        ton = ?, 
        year = ?, 
        uso = ?, 
        precio = ?
      WHERE id = ?`,
      [
        placa,
        vin || null,
        ubicacion,
        propietario,
        municipio,
        mes_de_placa,
        marca,
        modelo,
        parseInt(capacidad),
        parseFloat(ton),
        year,
        uso,
        precioNormalizado,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    if (req.file) {
      const dirPath = path.join("uploads", "vehicles", id.toString());
      await fs.mkdir(dirPath, { recursive: true });

      const files = await fs.readdir(dirPath);
      for (const file of files) {
        await fs.unlink(path.join(dirPath, file));
      }

      const fileName = `ruv_${Date.now()}${path.extname(req.file.originalname)}`;
      const fullPath = path.join(dirPath, fileName);
      await fs.writeFile(fullPath, req.file.buffer);

      await pool.query("UPDATE vehicles SET ruv = ? WHERE id = ?", [fullPath, id]);
    }

    res.json({ message: "Vehículo actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar vehículo" });
  }
});

// Eliminar vehículo + archivos
vehicleRouter.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM vehicles WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    const dirPath = path.join("uploads", "vehicles", id.toString());
    if (fsSync.existsSync(dirPath)) {
      await fs.rm(dirPath, { recursive: true, force: true });
    }

    res.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar vehículo" });
  }
});

export default vehicleRouter;
