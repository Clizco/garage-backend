import { Router } from "express";
import { pool } from "../../db.js";

const partsRouter = Router();

// Obtener todas las partes
partsRouter.get("/parts/all", async (_, res) => {
  try {
    const [parts] = await pool.query("SELECT * FROM mechanical_parts");
    res.json(parts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las partes" });
  }
});

// Obtener parte por ID
partsRouter.get("/parts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM mechanical_parts WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Parte no encontrada" });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la parte" });
  }
});

// Crear parte
partsRouter.post("/parts/create", async (req, res) => {
  const { part_name, part_number, quantity, price, available } = req.body;

  if (!part_name || !part_number || quantity == null || price == null) {
    return res.status(400).json({ message: "Los campos part_name, part_number, quantity y price son obligatorios" });
  }

  const normalizedPrice = parseFloat(price);
  const normalizedQuantity = parseInt(quantity);

  if (isNaN(normalizedPrice) || normalizedPrice <= 0) {
    return res.status(400).json({ message: "El precio debe ser un número positivo" });
  }

  if (isNaN(normalizedQuantity) || normalizedQuantity < 0) {
    return res.status(400).json({ message: "La cantidad debe ser un número válido" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO mechanical_parts (part_name, part_number, quantity, price, available) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        part_name,
        part_number,
        normalizedQuantity,
        normalizedPrice,
        available != null ? !!available : true
      ]
    );

    res.status(201).json({ message: "Parte creada correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "El número de parte ya existe" });
    }
    res.status(500).json({ message: "Error al crear la parte" });
  }
});

// Actualizar parte
partsRouter.put("/parts/update/:id", async (req, res) => {
  const { id } = req.params;
  const { part_name, part_number, quantity, price, available } = req.body;

  if (!part_name || !part_number || quantity == null || price == null) {
    return res.status(400).json({ message: "Los campos part_name, part_number, quantity y price son obligatorios" });
  }

  const normalizedPrice = parseFloat(price);
  const normalizedQuantity = parseInt(quantity);

  if (isNaN(normalizedPrice) || normalizedPrice <= 0) {
    return res.status(400).json({ message: "El precio debe ser un número positivo" });
  }

  if (isNaN(normalizedQuantity) || normalizedQuantity < 0) {
    return res.status(400).json({ message: "La cantidad debe ser un número válido" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE mechanical_parts SET 
        part_name = ?, 
        part_number = ?, 
        quantity = ?, 
        price = ?, 
        available = ?
      WHERE id = ?`,
      [
        part_name,
        part_number,
        normalizedQuantity,
        normalizedPrice,
        available != null ? !!available : true,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Parte no encontrada" });
    }

    res.json({ message: "Parte actualizada correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "El número de parte ya existe" });
    }
    res.status(500).json({ message: "Error al actualizar la parte" });
  }
});

// Eliminar parte
partsRouter.delete("/parts/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM mechanical_parts WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Parte no encontrada" });
    }

    res.json({ message: "Parte eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la parte" });
  }
});

export default partsRouter;
