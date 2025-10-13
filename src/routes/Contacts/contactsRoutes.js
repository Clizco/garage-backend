// contacts.router.js
import { Router } from "express";
import { pool } from "../../db.js";

const contactsRouter = Router();

/* ===== Helpers de validación simples ===== */
const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

const isValidEmail = (email) => {
  if (!isNonEmpty(email)) return false;
  // Sencillo, suficiente para validar formato común
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const normalizePhone = (phone) => String(phone || "").trim();

/* ===== Rutas ===== */

// Obtener todos los contactos
contactsRouter.get("/contacts/all", async (_, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, contact_name, contact_lastname, contact_email, contact_enterprise, contact_phone, created_at FROM contacts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    res.status(500).json({ message: "Error al obtener contactos" });
  }
});

// Obtener contacto por ID
contactsRouter.get("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, contact_name, contact_lastname, contact_email, contact_enterprise, contact_phone, created_at FROM contacts WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Contacto no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener el contacto:", error);
    res.status(500).json({ message: "Error al obtener el contacto" });
  }
});

// Crear contacto
contactsRouter.post("/contacts/create", async (req, res) => {
  try {
    const {
      contact_name,
      contact_lastname,
      contact_email,
      contact_enterprise = null,
      contact_phone,
    } = req.body || {};

    // Validaciones
    if (!isNonEmpty(contact_name) || !isNonEmpty(contact_lastname) || !isNonEmpty(contact_phone) || !isValidEmail(contact_email)) {
      return res.status(400).json({
        message:
          "Los campos contact_name, contact_lastname, contact_email (válido) y contact_phone son obligatorios",
      });
    }

    const phone = normalizePhone(contact_phone);

    const [result] = await pool.query(
      `INSERT INTO contacts
       (contact_name, contact_lastname, contact_email, contact_enterprise, contact_phone)
       VALUES (?, ?, ?, ?, ?)`,
      [contact_name.trim(), contact_lastname.trim(), contact_email.trim(), contact_enterprise, phone]
    );

    res.status(201).json({ message: "Contacto creado correctamente", id: result.insertId });
  } catch (error) {
    console.error("Error al crear el contacto:", error);
    // Si agregas UNIQUE(contact_email) en DB, podrías controlar el duplicado:
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El email ya se encuentra registrado" });
    }
    res.status(500).json({ message: "Error al crear el contacto" });
  }
});

// Actualizar contacto
contactsRouter.put("/contacts/update/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const {
      contact_name,
      contact_lastname,
      contact_email,
      contact_enterprise = null,
      contact_phone,
    } = req.body || {};

    // Validaciones
    if (!isNonEmpty(contact_name) || !isNonEmpty(contact_lastname) || !isNonEmpty(contact_phone) || !isValidEmail(contact_email)) {
      return res.status(400).json({
        message:
          "Los campos contact_name, contact_lastname, contact_email (válido) y contact_phone son obligatorios",
      });
    }

    const phone = normalizePhone(contact_phone);

    const [result] = await pool.query(
      `UPDATE contacts SET
        contact_name = ?,
        contact_lastname = ?,
        contact_email = ?,
        contact_enterprise = ?,
        contact_phone = ?
       WHERE id = ?`,
      [contact_name.trim(), contact_lastname.trim(), contact_email.trim(), contact_enterprise, phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contacto no encontrado" });
    }

    res.json({ message: "Contacto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el contacto:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El email ya se encuentra registrado" });
    }
    res.status(500).json({ message: "Error al actualizar el contacto" });
  }
});

// Eliminar contacto
contactsRouter.delete("/contacts/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM contacts WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contacto no encontrado" });
    }
    res.json({ message: "Contacto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el contacto:", error);
    res.status(500).json({ message: "Error al eliminar el contacto" });
  }
});

export default contactsRouter;
