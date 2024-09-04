import { Router } from "express";
import { pool } from "../../db.js";

const contactRouter = Router();

// Middleware to log IP address
contactRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Get all contacts
contactRouter.get("/contacts/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM contacts");
        console.log("Contacts retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving contacts:", error);
        return res.status(500).json({ error: 'Error retrieving contacts' });
    }
});

// Get a specific contact by ID
contactRouter.get("/:id", async (req, res) => {
    try {
        const contactId = req.params.id;
        const [result] = await pool.query("SELECT * FROM contacts WHERE id = ?", [contactId]);
        if (result.length === 0) {
            return res.status(404).json({ error: "Contact not found" });
        }
        return res.status(200).json(result[0]);
    } catch (error) {
        console.error("Error retrieving contact:", error);
        return res.status(500).json({ error: 'Error retrieving contact' });
    }
});

// Create a new contact
contactRouter.post("/create", async (req, res) => {
    try {
        const { contact_firstname, contact_lastname, contact_email, contact_phonenumber, contact_position, contact_department, contact_relationship } = req.body;

        const newContact = {
            contact_firstname,
            contact_lastname,
            contact_email,
            contact_phonenumber: contact_phonenumber,
            contact_position: contact_position,
            contact_department: contact_department,
            contact_relationship: contact_relationship,
        };

        if (!newContact.contact_firstname || !newContact.contact_email) {
            return res.status(400).send("Please provide all required contact data.");
        }

        const [result] = await pool.query("INSERT INTO contacts SET ?", [newContact]);
        res.json({ created: true, contactId: result.insertId });
    } catch (error) {
        console.error("Error creating contact:", error);
        res.status(500).send(error.message);
    }
});

// Update an existing contact
contactRouter.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { contact_firstname, contact_lastname, contact_email, contact_phonenumber, contact_position, contact_department, contact_relationship } = req.body;

        const updatedContact = {
            contact_firstname,
            contact_lastname,
            contact_email,
            contact_phonenumber,
            contact_position,
            contact_department,
            contact_relationship
        };

        const [result] = await pool.query("UPDATE contacts SET ? WHERE id = ?", [updatedContact, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Contact not found" });
        }

        res.json({ updated: true });
    } catch (error) {
        console.error("Error updating contact:", error);
        res.status(500).send(error.message);
    }
});

// Delete a contact
contactRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM contacts WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Contact not found" });
        }

        res.json({ deleted: true });
    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).send(error.message);
    }
});

export default contactRouter;
