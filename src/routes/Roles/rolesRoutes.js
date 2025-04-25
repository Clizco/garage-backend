import { Router } from "express";
import { pool } from "../../db.js";

const rolesRouter = Router();

// Middleware to log the IP
rolesRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Get all roles
rolesRouter.get("/roles/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM roles");
        console.log("Roles retrieved:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error retrieving roles:", error);
        return res.status(500).json({ error: 'Error retrieving roles' });
    }
});
 
rolesRouter.get("/roles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const [results] = await pool.query("SELECT * FROM roles WHERE role_id = ?", [id]);
        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: "Role not found" });
        }
    } catch (error) {
        console.error("Error retrieving role:", error);
        return res.status(500).json({ message: "Error retrieving role" });
    }
}
);

// Create a new role
rolesRouter.post("/create", async (req, res) => {
    try {
        const { role_name } = req.body;

        if (!role_name) {
            return res.status(400).send("Please provide all required role data.");
        }

        const newRole = {
            role_name: role_name
        };

        const result = await pool.query("INSERT INTO roles SET ?", [newRole]);
        const roleId = result[0].insertId;

        return res.status(200).json({ message: "Role created successfully", roleId });
    } catch (error) {
        console.error("Error creating role:", error);
        return res.status(500).json({ error: 'Error creating role' });
    }
});

// Update a role
rolesRouter.put("/update/:id", async (req, res) => {
    try {
        const { role_name } = req.body;
        const { id } = req.params;

        if (!role_name) {
            return res.status(400).send("Please provide all required role data.");
        }

        const updatedRole = {
            role_name: role_name
        };

        await pool.query("UPDATE roles SET ? WHERE role_id = ?", [updatedRole, id]);

        return res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        return res.status(500).json({ error: 'Error updating role' });
    }
});

// Delete a role
rolesRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM roles WHERE role_id = ?", [id]);

        return res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        return res.status(500).json({ error: 'Error deleting role' });
    }
});

export default rolesRouter;
