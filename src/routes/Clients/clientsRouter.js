import { Router } from "express";
import { pool } from "../../db.js";

const clientsRouter = Router();

// Obtener todos los clientes
clientsRouter.get("/clients/all", async (_, res) => {
  try {
    const [clients] = await pool.query("SELECT * FROM clients");
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

// Obtener cliente por ID
clientsRouter.get("/clients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
});

// Crear cliente
clientsRouter.post("/clients/create", async (req, res) => {
  const { client_name, client_ruc, client_type } = req.body;

  if (!client_name || !client_ruc || !client_type) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO clients (client_name, client_ruc, client_type) VALUES (?, ?, ?)`,
      [client_name, client_ruc, client_type]
    );

    res.status(201).json({ message: "Cliente creado correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "RUC ya existe" });
    }
    res.status(500).json({ message: "Error al crear el cliente" });
  }
});

// Actualizar cliente
clientsRouter.put("/clients/update/:id", async (req, res) => {
  const { id } = req.params;
  const { client_name, client_ruc, client_type } = req.body;

  if (!client_name || !client_ruc || !client_type) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    await pool.query(
      `UPDATE clients SET client_name = ?, client_ruc = ?, client_type = ? WHERE id = ?`,
      [client_name, client_ruc, client_type, id]
    );

    res.json({ message: "Cliente actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el cliente" });
  }
});

export default clientsRouter;
