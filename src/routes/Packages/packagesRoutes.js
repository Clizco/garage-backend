import { Router } from "express";
import { pool } from "../../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const packageRouter = Router();

// Log IP
packageRouter.use((req, res, next) => {
  console.log("IP:", req.ip);
  next();
});

// Middleware para preparar carpeta personalizada
const setUserInvoiceFolder = async (req, res, next) => {
  try {
    const user_id = req.query.user_id || req.headers["x-user-id"];
    if (!user_id) return res.status(400).json({ error: "Falta el user_id." });

    const [[user]] = await pool.query("SELECT user_unique_id FROM users WHERE id = ?", [user_id]);
    if (!user || !user.user_unique_id) return res.status(404).json({ error: "Usuario no encontrado." });

    const folderPath = `./uploads/invoices/${user.user_unique_id}`;
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    req.userInvoiceFolder = folderPath;
    req.userUniqueId = user.user_unique_id;
    req.userIdFromHeader = user_id;
    next();
  } catch (error) {
    console.error("Error en carpeta:", error);
    return res.status(500).json({ error: "Error al preparar carpeta." });
  }
};

// Configurar Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, req.userInvoiceFolder),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("Solo PDF."), false);
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// GET: Todos los paquetes
packageRouter.get("/packages/all", async (req, res) => {
  try {
    // Obtener todos los paquetes con info del usuario e invoice_path
    const [packages] = await pool.query(`
      SELECT 
        p.*, 
        pi.invoice_path,
        u.user_firstname,
        u.user_lastname,
        u.user_email,
        u.user_prefix
      FROM packages p
      LEFT JOIN package_invoices pi ON p.id = pi.package_id
      LEFT JOIN users u ON p.user_id = u.id
    `);

    if (!packages.length) {
      return res.status(404).json({ message: "No hay paquetes." });
    }

    // Obtener todos los productos
    const [products] = await pool.query(`SELECT * FROM package_products`);

    // Mapear productos a cada paquete
    const packagesWithProducts = packages.map(pkg => {
      const pkgProducts = products.filter(p => p.package_id === pkg.id);
      return {
        ...pkg,
        user_fullname: `${pkg.user_firstname} ${pkg.user_lastname}`,
        products: pkgProducts
      };
    });

    return res.status(200).json(packagesWithProducts);
  } catch (error) {
    console.error("Error en GET all packages:", error);
    return res.status(500).json({ error: 'Error al obtener todos los paquetes' });
  }
});



// GET: Paquetes de un usuario con productos
packageRouter.get("/packages/user/:user", async (req, res) => {
  try {
    const { user } = req.params;

    // Obtener todos los paquetes de ese usuario
    const [packages] = await pool.query(`
      SELECT p.*, pi.invoice_path
      FROM packages p
      LEFT JOIN package_invoices pi ON p.id = pi.package_id
      WHERE p.user_id = ?
    `, [user]);

    if (!packages.length) return res.status(404).json({ message: "No hay paquetes." });

    // Obtener productos por paquete
    const [products] = await pool.query(`
      SELECT * FROM package_products
      WHERE package_id IN (?)
    `, [packages.map(p => p.id)]);

    // Mapear productos a cada paquete
    const packagesWithProducts = packages.map(pkg => {
      const pkgProducts = products.filter(p => p.package_id === pkg.id);
      return { ...pkg, products: pkgProducts };
    });

    return res.status(200).json(packagesWithProducts);
  } catch (error) {
    console.error("Error en GET user packages:", error);
    return res.status(500).json({ error: 'Error al obtener paquetes del usuario' });
  }
});



// POST: Crear paquete con productos + factura
packageRouter.post(
  "/packages/create",
  setUserInvoiceFolder,
  (req, res, next) => {
    upload.single("invoice")(req, res, function (err) {
      if (err) {
        const msg = err instanceof multer.MulterError ? "Archivo muy grande (máx. 2MB)." : err.message;
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  async (req, res) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const user_id = req.userIdFromHeader;
      const { trackingId, products } = req.body;

      if (!user_id || !trackingId || !products) {
        return res.status(400).json({ error: "Faltan datos." });
      }

      const parsedProducts = JSON.parse(products);
      if (!Array.isArray(parsedProducts) || !parsedProducts.length) {
        return res.status(400).json({ error: "Lista de productos inválida." });
      }

      // Insertar paquete
      const [pkgResult] = await connection.query(
        "INSERT INTO packages (package_tracking_id, package_status, user_id) VALUES (?, 'Pending', ?)",
        [trackingId, user_id]
      );
      const packageId = pkgResult.insertId;

      // Insertar productos
      for (const p of parsedProducts) {
        const { weight, unit, description, value, store } = p;
        if (!weight || !unit || !description || !value || !store) {
          await connection.rollback();
          return res.status(400).json({ error: "Faltan datos de producto." });
        }

        await connection.query(
          `INSERT INTO package_products 
           (package_id, product_weight, product_unit, product_description, product_value, product_store)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [packageId, weight, unit, description, value, store]
        );
      }

      // Guardar factura
      if (req.file) {
        const invoice_path = `/uploads/invoices/${req.userUniqueId}/${req.file.filename}`;
        await connection.query(
          "INSERT INTO package_invoices (package_id, invoice_path, user_id) VALUES (?, ?, ?)",
          [packageId, invoice_path, user_id]
        );
      }

      await connection.commit();
      connection.release();
      return res.status(200).json({ message: "Paquete creado", packageId });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error creando paquete:", error);
      return res.status(500).json({ error: "Error interno al crear paquete." });
    }
  }
);

// DELETE: Eliminar paquete
packageRouter.delete("/packages/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM packages WHERE id = ?", [id]);
    return res.status(200).json({ message: "Paquete eliminado." });
  } catch (error) {
    console.error("Error al eliminar paquete:", error);
    return res.status(500).json({ error: "Error al eliminar paquete." });
  }
});

export default packageRouter;
