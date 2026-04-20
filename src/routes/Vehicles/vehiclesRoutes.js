import { Router } from "express";
import multer from "multer";
import { pool } from "../../db.js";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { createAuditLog, extractActorFromRequest } from "../../services/auditLogService.js";

const vehicleRouter = Router();

/** ========= MULTER (PDFs e Imágenes) =========
 * - Aumentamos los límites para permitir archivos grandes.
 * - Dejamos memoryStorage (tu lógica) pero OJO: si los archivos son muy grandes,
 *   esto consumirá RAM. Para producción recomiendo diskStorage temporal + rename,
 *   pero respetamos tu flujo actual.
 */
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
    // Máximo de archivos en la petición (1 ruv + 1 seguro + hasta 4 imágenes = 6)
    // Si quieres permitir más imágenes, sube este número y ajusta el maxCount del campo.
    files: 12,

    // Tamaño máximo por archivo (ej: 100 MB). Sube esto si necesitas más.
    fileSize: 100 * 1024 * 1024, // 100MB

    // (Opcional) limitar tamaño total de campos no file; lo dejamos alto por seguridad
    fieldSize: 10 * 1024 * 1024, // 10MB de campos de texto
  },
});

/** Middleware para capturar errores de Multer y devolver mensajes claros */
function handleMulterErrors(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      // Mensajes más amigables
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            message:
              "Archivo demasiado grande. Sube archivos de hasta 100MB o ajusta el límite del servidor.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            message: "Demasiados archivos en la solicitud.",
          });
        }
        return res.status(400).json({ message: `Error de carga: ${err.message}` });
      }
      return res.status(400).json({ message: err.message || "Error al subir archivo" });
    });
  };
}

function normalizePrecio(precioStr) {
  // acepta "$", "," y espacios
  return parseFloat(String(precioStr).replace(/[,$\s]/g, ""));
}

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function parseIntegerOrNull(value) {
  const normalized = emptyToNull(value);
  if (normalized === null) return null;
  const parsed = parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDecimalOrNull(value) {
  const normalized = emptyToNull(value);
  if (normalized === null) return null;
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeAuditValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function buildChangedFields(previousRow, nextValues) {
  const changedFields = {};

  for (const [field, nextValueRaw] of Object.entries(nextValues)) {
    const before = normalizeAuditValue(previousRow?.[field]);
    const after = normalizeAuditValue(nextValueRaw);
    if (before !== after) {
      changedFields[field] = { before, after };
    }
  }

  return changedFields;
}

let panapassColumnEnsured = false;
async function ensureVehiclePanapassColumn() {
  if (panapassColumnEnsured) return;
  try {
    await pool.query("ALTER TABLE vehicles ADD COLUMN panapass VARCHAR(50) NULL");
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
  panapassColumnEnsured = true;
}

let optionalVehicleColumnsEnsured = false;
async function ensureVehicleOptionalColumns() {
  if (optionalVehicleColumnsEnsured) return;

  await pool.query(`
    UPDATE vehicles
    SET \`year\` = 1901
    WHERE \`year\` IS NOT NULL
      AND (
        TRIM(CAST(\`year\` AS CHAR)) = ''
        OR CAST(\`year\` AS UNSIGNED) < 1901
        OR CAST(\`year\` AS UNSIGNED) > 2155
      )
  `);

  const alterStatements = [
    "ALTER TABLE vehicles MODIFY ubicacion VARCHAR(100) NULL",
    "ALTER TABLE vehicles MODIFY propietario VARCHAR(100) NULL",
    "ALTER TABLE vehicles MODIFY municipio VARCHAR(100) NULL",
    "ALTER TABLE vehicles MODIFY mes_de_placa VARCHAR(20) NULL",
    "ALTER TABLE vehicles MODIFY marca VARCHAR(50) NULL",
    "ALTER TABLE vehicles MODIFY modelo VARCHAR(50) NULL",
    "ALTER TABLE vehicles MODIFY capacidad INT NULL",
    "ALTER TABLE vehicles MODIFY ton DECIMAL(10,2) NULL",
    "ALTER TABLE vehicles MODIFY \`year\` YEAR NULL",
    "ALTER TABLE vehicles MODIFY precio_venta DECIMAL(10,2) NULL",
    "ALTER TABLE vehicles MODIFY estado VARCHAR(50) NULL",
    "ALTER TABLE vehicles MODIFY uso VARCHAR(100) NULL",
    "ALTER TABLE vehicles MODIFY precio VARCHAR(45) NULL",
  ];

  for (const statement of alterStatements) {
    await pool.query(statement);
  }

  optionalVehicleColumnsEnsured = true;
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
  handleMulterErrors(
    upload.fields([
      { name: "ruv", maxCount: 1 },
      { name: "seguro_pdf", maxCount: 1 },
      { name: "vehicle_images", maxCount: 4 }, // si quieres permitir más, súbelo y ajusta el front
    ])
  ),
  async (req, res) => {
    try {
      const actor = extractActorFromRequest(req);
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
        panapass,
        precio,
        precio_venta,
        estado,
      } = req.body;

      if (!placa || !String(placa).trim()) {
        return res.status(400).json({ message: "La placa es obligatoria" });
      }

      await ensureVehiclePanapassColumn();
      await ensureVehicleOptionalColumns();

      const precioIngresado = emptyToNull(precio);
      const precioVentaIngresado = emptyToNull(precio_venta);
      const precioNormalizado = precioIngresado ? normalizePrecio(precioIngresado) : null;
      const precioVentaNormalizado = precioVentaIngresado ? normalizePrecio(precioVentaIngresado) : null;

      if (precioIngresado && isNaN(precioNormalizado)) {
        return res.status(400).json({ message: "El precio debe ser un número válido" });
      }
      if (precioVentaIngresado && isNaN(precioVentaNormalizado)) {
        return res.status(400).json({ message: "El precio_venta debe ser un número válido" });
      }

      // 1) Insert base
      const [result] = await pool.query(
        `INSERT INTO vehicles 
         (placa, vin, ubicacion, propietario, municipio, mes_de_placa, marca, modelo, capacidad, ton, year, uso, panapass, precio, precio_venta, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(placa).trim(),
          emptyToNull(vin),
          emptyToNull(ubicacion),
          emptyToNull(propietario),
          emptyToNull(municipio),
          emptyToNull(mes_de_placa),
          emptyToNull(marca),
          emptyToNull(modelo),
          parseIntegerOrNull(capacidad),
          parseDecimalOrNull(ton),
          emptyToNull(year),
          emptyToNull(uso),
          emptyToNull(panapass),
          precioNormalizado,
          precioVentaNormalizado,
          emptyToNull(estado),
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

      // ✅ Registrar en logs
      await createAuditLog({
        userId: actor.userId,
        userEmail: actor.userEmail,
        action: "CREATE",
        entityType: "VEHICLE",
        entityId: vehicleId,
        entityName: placa,
        changes: { placa, marca, modelo, year, estado },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      res.status(201).json({ message: "Vehículo registrado correctamente", id: vehicleId });
    } catch (error) {
      console.error("Error al registrar vehículo:", error);
      res.status(500).json({ message: "Error al registrar vehículo" });
    }
  }
);

// Actualizar vehículo (con subcarpetas docs/ e images/)
// Actualizar vehículo (APPEND imágenes, quitar solo las indicadas)
vehicleRouter.put(
  "/vehicles/update/:id",
  handleMulterErrors(
    upload.fields([
      { name: "ruv", maxCount: 1 },
      { name: "seguro_pdf", maxCount: 1 },
      { name: "vehicle_images", maxCount: 12 }, // puedes subir varias en una petición
    ])
  ),
  async (req, res) => {
    const { id } = req.params;
    const actor = extractActorFromRequest(req);
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
      panapass,
      precio,
      precio_venta,
      estado,
      removed_images, // ← viene del front (JSON string o array)
    } = req.body;

    // ===== Validaciones base (mismas que tenías) =====
    if (!placa || !String(placa).trim()) {
      return res.status(400).json({ message: "La placa es obligatoria" });
    }

    await ensureVehiclePanapassColumn();
    await ensureVehicleOptionalColumns();

    const precioIngresado = emptyToNull(precio);
    const precioVentaIngresado = emptyToNull(precio_venta);
    const precioNormalizado = precioIngresado ? normalizePrecio(precioIngresado) : null;
    const precioVentaNormalizado = precioVentaIngresado ? normalizePrecio(precioVentaIngresado) : null;

    if (precioIngresado && isNaN(precioNormalizado)) {
      return res.status(400).json({ message: "El precio debe ser un número válido" });
    }
    if (precioVentaIngresado && isNaN(precioVentaNormalizado)) {
      return res.status(400).json({ message: "El precio_venta debe ser un número válido" });
    }

    try {
      const [beforeRows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [id]);
      if (!beforeRows.length) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }

      const previousVehicle = beforeRows[0];

      const normalizedUpdatePayload = {
        placa: String(placa).trim(),
        vin: emptyToNull(vin),
        ubicacion: emptyToNull(ubicacion),
        propietario: emptyToNull(propietario),
        municipio: emptyToNull(municipio),
        mes_de_placa: emptyToNull(mes_de_placa),
        marca: emptyToNull(marca),
        modelo: emptyToNull(modelo),
        capacidad: parseIntegerOrNull(capacidad),
        ton: parseDecimalOrNull(ton),
        year: emptyToNull(year),
        uso: emptyToNull(uso),
        panapass: emptyToNull(panapass),
        precio: precioNormalizado,
        precio_venta: precioVentaNormalizado,
        estado: emptyToNull(estado),
      };

      // ===== 1) Actualizar campos base =====
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
          panapass = ?,
          precio = ?,
          precio_venta = ?,
          estado = ?
        WHERE id = ?`,
        [
          normalizedUpdatePayload.placa,
          normalizedUpdatePayload.vin,
          normalizedUpdatePayload.ubicacion,
          normalizedUpdatePayload.propietario,
          normalizedUpdatePayload.municipio,
          normalizedUpdatePayload.mes_de_placa,
          normalizedUpdatePayload.marca,
          normalizedUpdatePayload.modelo,
          normalizedUpdatePayload.capacidad,
          normalizedUpdatePayload.ton,
          normalizedUpdatePayload.year,
          normalizedUpdatePayload.uso,
          normalizedUpdatePayload.panapass,
          normalizedUpdatePayload.precio,
          normalizedUpdatePayload.precio_venta,
          normalizedUpdatePayload.estado,
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

      // ===== 2) PDFs (misma lógica, reemplazan su tipo) =====
      if (files.ruv && files.ruv[0]) {
        await removeFilesByPrefix(docsDir, "ruv_");
        const file = files.ruv[0];
        const fileName = `ruv_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(id), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET ruv = ? WHERE id = ?", [relPath, id]);
      }

      if (files.seguro_pdf && files.seguro_pdf[0]) {
        await removeFilesByPrefix(docsDir, "seguro_");
        const file = files.seguro_pdf[0];
        const fileName = `seguro_${Date.now()}${path.extname(file.originalname) || ".pdf"}`;
        const relPath  = path.join("uploads", "vehicles", String(id), "docs", fileName);
        await writeBuffer(relPath, file.buffer);
        await pool.query("UPDATE vehicles SET seguro_pdf = ? WHERE id = ?", [relPath, id]);
      }

      // ===== 3) IMÁGENES: APPEND + REMOVER SOLO LAS INDICADAS =====

      // 3.1) Traer del DB las imágenes actuales
      const [rows] = await pool.query(
        "SELECT vehicle_images FROM vehicles WHERE id = ?",
        [id]
      );
      const currentJson = rows?.[0]?.vehicle_images || "[]";
      let currentImages = [];
      try {
        currentImages = JSON.parse(currentJson);
        if (!Array.isArray(currentImages)) currentImages = [];
      } catch {
        currentImages = [];
      }

      // 3.2) Quitar solo las que marca el front en removed_images
      let toRemove = [];
      if (Array.isArray(removed_images)) {
        toRemove = removed_images;
      } else if (typeof removed_images === "string" && removed_images.trim()) {
        try {
          const parsed = JSON.parse(removed_images);
          if (Array.isArray(parsed)) toRemove = parsed;
        } catch {
          // si mandan CSV por error
          toRemove = removed_images.split(",").map(s => s.trim()).filter(Boolean);
        }
      }

      if (toRemove.length > 0) {
        // eliminar físicamente los archivos indicados (si existen)
        for (const rel of toRemove) {
          const abs = path.join(process.cwd(), rel);
          if (fsSync.existsSync(abs)) {
            try { await fs.unlink(abs); } catch (_) {}
          }
        }
        // y filtrarlos del arreglo actual
        const toRemoveSet = new Set(toRemove);
        currentImages = currentImages.filter(p => !toRemoveSet.has(p));
      }

      // 3.3) Agregar nuevas (sin borrar las existentes)
      const MAX_TOTAL_IMAGES = 12; // ← Ajusta el tope total que quieras
      const remainingSlots   = Math.max(0, MAX_TOTAL_IMAGES - currentImages.length);
      const imagesCountBeforeAdd = currentImages.length;

      if (files.vehicle_images && files.vehicle_images.length > 0 && remainingSlots > 0) {
        // Solo procesar hasta "remainingSlots"
        const toProcess = files.vehicle_images.slice(0, remainingSlots);
        for (let i = 0; i < toProcess.length; i++) {
          const f = toProcess[i];
          const ext = path.extname(f.originalname) || ".jpg";
          // usa el largo actual para numerar o simplemente usa timestamp
          const fileName = `img_${currentImages.length + 1}_${Date.now()}${ext}`;
          const relPath  = path.join("uploads", "vehicles", String(id), "images", fileName);
          await writeBuffer(relPath, f.buffer);
          currentImages.push(relPath);
        }
      }

      const changedFields = buildChangedFields(previousVehicle, normalizedUpdatePayload);
      const removedImagesCount = toRemove.length;
      const addedImagesCount = Math.max(0, currentImages.length - imagesCountBeforeAdd);
      const hasRuvReplacement = Boolean(files.ruv && files.ruv[0]);
      const hasSeguroReplacement = Boolean(files.seguro_pdf && files.seguro_pdf[0]);

      // 3.4) Guardar el arreglo final (si hay cambios)
      await pool.query(
        "UPDATE vehicles SET vehicle_images = ? WHERE id = ?",
        [JSON.stringify(currentImages), id]
      );

      // ===== 4) Respuesta =====
      // ✅ Registrar actualización en logs
      await createAuditLog({
        userId: actor.userId,
        userEmail: actor.userEmail,
        action: "UPDATE",
        entityType: "VEHICLE",
        entityId: parseInt(id),
        entityName: normalizedUpdatePayload.placa || previousVehicle?.placa || "Vehículo",
        changes: {
          changedFields,
          files: {
            ruvUpdated: hasRuvReplacement,
            seguroUpdated: hasSeguroReplacement,
            imagesAdded: addedImagesCount,
            imagesRemoved: removedImagesCount,
          },
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      res.json({ message: "Vehículo actualizado correctamente", images: currentImages });
    } catch (error) {
      console.error("Error al actualizar vehículo:", error);
      res.status(500).json({ message: "Error al actualizar vehículo" });
    }
  }
);


// Eliminar vehículo + carpetas
vehicleRouter.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const actor = extractActorFromRequest(req);
    // Traer info del vehículo antes de eliminarlo
    const [vehicle] = await pool.query("SELECT placa FROM vehicles WHERE id = ?", [id]);

    const [result] = await pool.query("DELETE FROM vehicles WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    // ✅ Registrar eliminación en logs
    await createAuditLog({
      userId: actor.userId,
      userEmail: actor.userEmail,
      action: "DELETE",
      entityType: "VEHICLE",
      entityId: parseInt(id),
      entityName: vehicle[0]?.placa || "Vehículo",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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
