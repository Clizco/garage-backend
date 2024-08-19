import { Router } from "express";
import { pool } from "../db.js";

const productRouter = Router();

// Middleware que registra la IP
productRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Obtener todos los productos
productRouter.get("/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM products");
        console.log(rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return res.status(500).send("Error interno del servidor");
    }
});

// Obtener todos los productos de un usuario específico
productRouter.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        
        const [rows] = await pool.query("SELECT * FROM products WHERE user_id = ?", [userId]);

        
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron productos para este usuario" });
        }

        // Devolver los productos encontrados
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return res.status(500).send("Error interno del servidor");
    }
});


// Crear un nuevo producto
productRouter.post("/:userId/create", async (req, res) => {
    try {
        const { product_name, product_description, product_price } = req.body;
        const userId = req.params.userId; // ID del usuario obtenido de la URL

        

        const newProduct = {
            product_name,
            product_description,
            product_price,
            user_id: userId 
        };

        const result = await pool.query("INSERT INTO products SET ?", [newProduct]);

        return res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
        console.error("Error al crear producto:", error);
        return res.status(500).send("Error interno del servidor");
    }
});

// Actualizar un producto
productRouter.put("/products/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;

        const updatedProduct = {};

        if (name) updatedProduct.name = name;
        if (description) updatedProduct.description = description;
        if (price) updatedProduct.price = price;

        if (Object.keys(updatedProduct).length === 0) {
            return res.status(400).send("Por favor ingrese los campos a actualizar");
        }

        const [result] = await pool.query("UPDATE products SET ? WHERE id = ?", [updatedProduct, id]);

        return res.status(200).json({ result, success: true, message: "Producto actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        return res.status(500).send("Error interno del servidor");
    }
});

// Eliminar un producto
productRouter.delete("/products/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);

        return res.status(200).json({ result, success: true, message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        return res.status(500).send("Error interno del servidor");
    }
});

export default productRouter;
