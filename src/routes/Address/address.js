import { Router } from "express";
import { pool } from "../../db.js";

const addressRouter = Router();

// Middleware que registra la IP
addressRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Obtener una dirección por ID
addressRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await pool.query("SELECT * FROM address WHERE id = ?", [id]);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Obtener todas las direcciones
addressRouter.get("/address/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, address_person_fullname, address_phonenumber, address_details, address_province, address_user, created_at FROM address"
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Crear una nueva dirección
addressRouter.post("/address/create", async (req, res) => {
    try {
        const newAddress = {
            address_person_fullname: req.body.address_person_fullname,
            address_phonenumber: req.body.address_phonenumber,
            address_details: req.body.address_details,
            address_province: req.body.address_province,
            address_user: req.body.address_user,
        };

        if (!newAddress.address_person_fullname || !newAddress.address_phonenumber || !newAddress.address_details || !newAddress.address_province || !newAddress.address_user) {
            return res.status(400).send("Por favor ingrese todos los datos requeridos");
        }

        const result = await pool.query("INSERT INTO address SET ?", [newAddress]);
        res.status(201).json({ message: "Dirección creada con éxito", result });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

addressRouter.get("/address/user/:user", async (req, res) => {
    try {
        const { user } = req.params;
        const [rows] = await pool.query("SELECT * FROM address WHERE address_user = ?", [user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron direcciones para este usuario" });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


// Eliminar una dirección por ID
addressRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM address WHERE id = ?", [id]);
        res.json({ message: "Dirección eliminada con éxito", result });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

export default addressRouter;
