import { Router } from "express";
import multer from "multer";
import { pool } from "../../db.js";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

const vehicleRouter = Router();

/** ========= MULTER (PDFs e Imágenes) ========= */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    try {
      const isPdfField = file.fieldname === "ruv" || file.fieldname === "seguro_pdf";
      const isImagesField = file.fieldname === "vehicle_images";

      if (isPdfField && file.mimetype !== "application/pdf") {
        return cb(new Error("Solo se permiten archivos PDF"));
      }
      if (isImagesField && !/^image\//.test(file.mimetype)) {
        return cb(new Error("Solo se permiten imágenes (jpg, png, webp, etc.)"));
      }
      if (!isPdfField && !isImagesField) {
        return cb(new Error("Campo de archivo no permitido"));
      }
      cb(null, true);
    } catch (e) {
      cb(e);
    }
  },
  limits: {
    files: 6, // 1 ruv + 1 seguro + hasta 4 imágenes
  },
});

function normalizePrecio(precioStr) {
  return parseFloat(String(precioStr).replace(/,/g, ""));
}

/** Helpers FS */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeBuffer(fullPath, buffer) {
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

async function removeFilesByPrefix(dirPath, prefix) {
  if (!fsSync.existsSync(dirPath)) return;
  const files = await fs.readdir(dirPath);
  for (const file of files) {
    if (file.startsWith(prefix)) {
      await fs.unlink(path.join(dirPath, file));
    }
  }
}

// ---------- RUTAS ----------

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

// Crear vehículo (con subcarpetas docs/ e images/)
vehicleRouter.post(
  "/create",
  upload.fields([
    { name: "ruv", maxCount: 1 },
    { name: "seguro_pdf", maxCount: 1 },
    { name: "vehicle_images", maxCount: 4 },
  ]),
  async (req, res) => {
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
        precio,
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

      // 1) Insert base
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
          precioNormalizado,
        ]
      );

      const vehicleId = result.insertId;
      const baseDir   = path.join("uploads", "vehicles", String(vehicleId));
      const docsDir   = path.join(baseDir, "docs");
      const imagesDir = path.join(baseDir, "images");
      await ensureDir(docsDir);
      await ensureDir(imagesDir);

      // 2) Archivos
      const files = req.files || {};

      // RUV (PDF) -> docs/
      if (files.ruv && files.ruv[0]) {
        const file = files.ruv[0];
        const fileName = `ruv_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(vehicleId), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET ruv = ? WHERE id = ?", [relPath, vehicleId]);
      }

      // Seguro (PDF) -> docs/
      if (files.seguro_pdf && files.seguro_pdf[0]) {
        const file = files.seguro_pdf[0];
        const fileName = `seguro_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(vehicleId), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET seguro_pdf = ? WHERE id = ?", [relPath, vehicleId]);
      }

      // Imágenes (hasta 4) -> images/
      if (files.vehicle_images && files.vehicle_images.length > 0) {
        const paths = [];
        for (let i = 0; i < Math.min(files.vehicle_images.length, 4); i++) {
          const f = files.vehicle_images[i];
          const ext = path.extname(f.originalname) || ".jpg";
          const fileName = `img_${i + 1}_${Date.now()}${ext}`;
          const relPath  = path.join("uploads", "vehicles", String(vehicleId), "images", fileName);
          await writeBuffer(relPath, f.buffer);
          paths.push(relPath);
        }
        await pool.query("UPDATE vehicles SET vehicle_images = ? WHERE id = ?", [JSON.stringify(paths), vehicleId]);
      }

      res.status(201).json({ message: "Vehículo registrado correctamente", id: vehicleId });
    } catch (error) {
      console.error("Error al registrar vehículo:", error);
      res.status(500).json({ message: "Error al registrar vehículo" });
    }
  }
);

// Actualizar vehículo (con subcarpetas docs/ e images/)
vehicleRouter.put(
  "/vehicles/update/:id",
  upload.fields([
    { name: "ruv", maxCount: 1 },
    { name: "seguro_pdf", maxCount: 1 },
    { name: "vehicle_images", maxCount: 4 },
  ]),
  async (req, res) => {
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
      precio,
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
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }

      const baseDir   = path.join("uploads", "vehicles", String(id));
      const docsDir   = path.join(baseDir, "docs");
      const imagesDir = path.join(baseDir, "images");
      await ensureDir(docsDir);
      await ensureDir(imagesDir);

      const files = req.files || {};

      // Nuevo RUV => borrar ruv_* en docs/ y subir el nuevo
      if (files.ruv && files.ruv[0]) {
        await removeFilesByPrefix(docsDir, "ruv_");
        const file = files.ruv[0];
        const fileName = `ruv_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(id), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET ruv = ? WHERE id = ?", [relPath, id]);
      }

      // Nuevo SEGURO => borrar seguro_* en docs/ y subir el nuevo
      if (files.seguro_pdf && files.seguro_pdf[0]) {
        await removeFilesByPrefix(docsDir, "seguro_");
        const file = files.seguro_pdf[0];
        const fileName = `seguro_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(id), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET seguro_pdf = ? WHERE id = ?", [relPath, id]);
      }

      // Nuevas IMÁGENES => borrar img_* en images/ y setear JSON nuevo
      if (files.vehicle_images && files.vehicle_images.length > 0) {
        await removeFilesByPrefix(imagesDir, "img_");
        const paths = [];
        for (let i = 0; i < Math.min(files.vehicle_images.length, 4); i++) {
          const f = files.vehicle_images[i];
          const ext = path.extname(f.originalname) || ".jpg";
          const fileName = `img_${i + 1}_${Date.now()}${ext}`;
          const relPath  = path.join("uploads", "vehicles", String(id), "images", fileName);
          await writeBuffer(relPath, f.buffer);
          paths.push(relPath);
        }
        await pool.query("UPDATE vehicles SET vehicle_images = ? WHERE id = ?", [JSON.stringify(paths), id]);
      }

      res.json({ message: "Vehículo actualizado correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar vehículo" });
    }
  }
);

// Eliminar vehículo + carpetas
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
