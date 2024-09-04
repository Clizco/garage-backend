import { Router } from "express";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import config from "../config.js";

const clientRouter = Router();

// Middleware que registra la IP
clientRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Traer un cliente a través del NIF
clientRouter.get("/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const [results] = await pool.query(
            "SELECT * FROM accounts WHERE account_nif = ? AND account_relationship = 'CLIENTE'",
            [nif]
        );

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Traer todos los clientes en la base de datos
clientRouter.get("/clients/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, created_at, account_name, account_legal_name, account_nif, account_website, account_relationship, account_phone, account_country, account_province, account_city, account_address FROM accounts WHERE account_relationship = 'CLIENTE'"
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Crear un nuevo cliente
clientRouter.post("/create/", async (req, res) => {
    try {
        const newClient = {
            account_name: req.body.account_name,
            account_legal_name: req.body.account_legal_name,
            account_nif: req.body.account_nif,
            account_website: req.body.account_website,
            account_phone: req.body.account_phone,
            account_country: req.body.account_country,
            account_province: req.body.account_province,
            account_city: req.body.account_city,
            account_address: req.body.account_address,
            account_relationship: req.body.account_relationship,
        };

        // Verifica que todos los datos sean proporcionados
        if (!newClient) {
            return res.status(401).send("Por favor ingrese todos los datos del cliente");
        }

        const token = jwt.sign({ id: newClient.account_nif }, config.secret, {
            expiresIn: 60 * 60 * 24,
        });

        const result = await pool.query("INSERT INTO accounts SET ?", [newClient]);

        res.json({ auth: true, result, token });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Eliminar un cliente por NIF
clientRouter.delete("/delete/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const result = await pool.query("DELETE FROM accounts WHERE account_nif = ? AND account_relationship = 'CLIENTE'", [nif]);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

export default clientRouter;
