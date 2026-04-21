import { Router } from "express";
import { pool } from "../../db.js";

const ownersRouter = Router();

let ownersTableEnsured = false;

async function ensureOwnersTable() {
  if (ownersTableEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS owners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_name VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  ownersTableEnsured = true;
}

async function migrateOwnersFromVehicles() {
  await ensureOwnersTable();

  const [result] = await pool.query(`
    INSERT IGNORE INTO owners (owner_name)
    SELECT DISTINCT TRIM(propietario)
    FROM vehicles
    WHERE propietario IS NOT NULL AND TRIM(propietario) <> ''
  `);

  return result.affectedRows || 0;
}

ownersRouter.get("/all", async (_, res) => {
  try {
    await migrateOwnersFromVehicles();
    const [owners] = await pool.query("SELECT * FROM owners ORDER BY owner_name ASC");
    res.json(owners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener propietarios" });
  }
});

ownersRouter.get("/:id", async (req, res) => {
  try {
    await ensureOwnersTable();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM owners WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Propietario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener propietario" });
  }
});

ownersRouter.post("/create", async (req, res) => {
  try {
    await ensureOwnersTable();

    const ownerName = String(req.body.owner_name || "").trim();
    if (!ownerName) {
      return res.status(400).json({ message: "El nombre del propietario es obligatorio" });
    }

    const [result] = await pool.query(
      "INSERT INTO owners (owner_name) VALUES (?)",
      [ownerName]
    );

    res.status(201).json({ message: "Propietario creado correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Ese propietario ya existe" });
    }
    res.status(500).json({ message: "Error al crear propietario" });
  }
});

ownersRouter.put("/update/:id", async (req, res) => {
  try {
    await ensureOwnersTable();

    const { id } = req.params;
    const ownerName = String(req.body.owner_name || "").trim();

    if (!ownerName) {
      return res.status(400).json({ message: "El nombre del propietario es obligatorio" });
    }

    const [result] = await pool.query(
      "UPDATE owners SET owner_name = ? WHERE id = ?",
      [ownerName, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Propietario no encontrado" });
    }

    res.json({ message: "Propietario actualizado correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Ese propietario ya existe" });
    }
    res.status(500).json({ message: "Error al actualizar propietario" });
  }
});

ownersRouter.delete("/delete/:id", async (req, res) => {
  try {
    await ensureOwnersTable();

    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM owners WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Propietario no encontrado" });
    }

    res.json({ message: "Propietario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar propietario" });
  }
});

ownersRouter.post("/migrate-from-vehicles", async (_, res) => {
  try {
    const inserted = await migrateOwnersFromVehicles();
    res.json({ message: "Migración completada", inserted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al migrar propietarios desde vehículos" });
  }
});

export default ownersRouter;
