import { Router } from "express";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js";

const providerRouter = Router();

// Middleware que registra la IP
providerRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Traer un proveedor a través del NIF
providerRouter.get("/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const [results] = await pool.query("SELECT * FROM providers WHERE provider_nif = ?", [nif]);

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Traer todos los proveedores en la base de datos
providerRouter.get("/providers/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, created_at, provider_name, provider_legal_name, provider_nif, provider_website, provider_phone, provider_country, provider_province, provider_city, provider_address FROM providers"
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Crear un nuevo proveedor
providerRouter.post("/create/",  async (req, res) => {
    try {
        const newProvider = {
            provider_name: req.body.provider_name,
            provider_legal_name: req.body.provider_legal_name,
            provider_nif: req.body.provider_nif,
            provider_website: req.body.provider_website,
            provider_phone: req.body.provider_phone,
            provider_country: req.body.provider_country,
            provider_province: req.body.provider_province,
            provider_city: req.body.provider_city,
            provider_address: req.body.provider_address,
        };

        if (!newProvider) {
            return res.status(401).send("Por favor ingrese todos los datos del proveedor");
        }

        const token = jwt.sign({ id: newProvider.provider_nif }, config.secret, {
            expiresIn: 60 * 60 * 24,
        });

        const result = await pool.query("INSERT INTO providers SET ?", [newProvider]);

        res.json({ auth: true, result, token });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Eliminar un proveedor por NIF
providerRouter.delete("/delete/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const result = await pool.query("DELETE FROM providers WHERE provider_nif = ?", [nif]);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

export default providerRouter;
