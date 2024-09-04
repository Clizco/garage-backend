import { Router } from "express";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js"

const accountsRouter = Router();

// middleware que registra la IP
accountsRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Traer una cuenta a través del NIF
accountsRouter.get("/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const [results] = await pool.query("SELECT * FROM accounts WHERE account_nif = ?", [nif]);

        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Traer todas las cuentas en la base de datos
accountsRouter.get("/accounts/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, created_at, account_name, account_legal_name, account_nif, account_website, account_relationship, account_phone, account_country, account_province, account_city, account_address FROM accounts"
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Crear una nueva cuenta
accountsRouter.post("/create/",  async (req, res) => {
    try {
        const newAccount = {
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

        if (!newAccount) {
            return res.status(401).send("Por favor ingrese todos los datos de la cuenta");
        }

        const token = jwt.sign({ id: newAccount.account_nif }, config.secret, {
            expiresIn: 60 * 60 * 24,
        });

        const result = await pool.query("INSERT INTO accounts SET ?", [newAccount]);

        res.json({ auth: true, result, token });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

// Eliminar una cuenta por NIF
accountsRouter.delete("/delete/:nif", async (req, res) => {
    try {
        const nif = req.params.nif;

        const result = await pool.query("DELETE FROM accounts WHERE account_nif = ?", [nif]);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

export default accountsRouter;
