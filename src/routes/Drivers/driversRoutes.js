import { Router } from "express";
import { validateCreate } from "../../validators/drivers.js";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js"
import bcrypt from "bcrypt"
import { jwtDecode } from "jwt-decode";

const driverRouter = Router();

driverRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

driverRouter.get("/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const [results] = await pool.query("SELECT * FROM driver WHERE driver_email = ?", [email]);
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
    }
});

driverRouter.get("/drivers/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM driver");
        return res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener conductores' });
    }
});

driverRouter.get("/drivers/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const [results] = await pool.query("SELECT * FROM driver WHERE id = ?", [id]);
        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: "Conductor no encontrado" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error del servidor" });
    }
});

driverRouter.get("/drivers/role/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Consulta para obtener el nombre del rol del driver
      const [rows] = await pool.query(
        `SELECT roles.role_name 
         FROM driver 
         JOIN roles ON driver.role_id = roles.id 
         WHERE driver.id = ?`,
        [id]
      );
  
      // Verificar si se encontró un driver con el ID dado
      if (rows.length === 0) {
        return res.status(404).json({ error: "Conductor no encontrado" });
      }
  
      const driverRole = rows[0].role_name;
      console.log("Rol del conductor:", driverRole);
  
      // Verificar si el rol es "driver" o "admin"
      if (driverRole === "driver" || driverRole === "admin") {
        return res.status(200).json({ message: "Acceso permitido", role: driverRole });
      } else {
        return res.status(403).json({ error: "Acceso denegado" });
      }
    } catch (error) {
      console.error("Error al obtener el rol del conductor:", error);
      return res.status(500).json({ error: "Error al obtener el rol del conductor" });
    }
  });


driverRouter.post("/signup/", validateCreate, async (req, res) => {
    try {
        const { driver_name, driver_email, driver_phonenumber, driver_password, driver_province } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(driver_password, salt);

        const newDriver = {
            driver_name,
            driver_email,
            driver_phonenumber,
            role_id: 3,
            driver_password: hash,
            driver_province
        };

        if (!newDriver.driver_email || !newDriver.driver_password) {
            return res.status(401).send("Por favor ingrese todos los datos del conductor");
        }

        const result = await pool.query("INSERT INTO driver SET ?", [newDriver]);
        const token = jwt.sign({ id: result.insertId }, config.secret, { expiresIn: 60 * 60 * 24 });

        res.json({ auth: true, result, token });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

driverRouter.post("/signin/", async (req, res) => {
    try {
        const email = req.body.driver_email;
        const password = req.body.driver_password;
        const [currentDriver] = await pool.query("SELECT * FROM driver WHERE driver_email = ?", [email]);
        const driver = currentDriver[0];

        if (!email) return res.status(401).send("Falta el correo !!");
        if (!password) return res.status(401).send("Falta la contrasena !!");
        if (!driver) return res.status(401).send("El conductor no está registrado, por favor regístrese");

        const result = bcrypt.compareSync(password, driver.driver_password);
        if (!result) {
            return res.status(401).send({ auth: result, message: "La contraseña es incorrecta" });
        } else {
            const token = jwt.sign({ id: driver.id, email: driver.driver_email }, config.secret, { expiresIn: 60 * 60 * 24 });
            const decode = jwtDecode(token);
            res.json({ auth: result, message: `Bienvenido ${email}`, token, decode });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

driverRouter.get("/driver/token/", async (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({ auth: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, config.secret);
        const [rows] = await pool.execute('SELECT * FROM driver WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Conductor no encontrado' });
        }

        const driver = rows[0];
        delete driver.password;

        res.json(driver);
    } catch (err) {
        return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
    }
});

driverRouter.post("/drivers/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [currentDriver] = await pool.query("SELECT * FROM driver WHERE id = ?", [id]);

        if (!currentDriver.length) {
            return res.status(404).json({ message: "Conductor no encontrado" });
        }

        const updatedDriver = {
            driver_name: req.body.driver_name || currentDriver[0].driver_name,
            driver_email: req.body.driver_email || currentDriver[0].driver_email,
            driver_province: req.body.driver_province || currentDriver[0].driver_province,
            driver_phonenumber: req.body.driver_phonenumber || currentDriver[0].driver_phonenumber
        };

        await pool.query("UPDATE driver SET ? WHERE id = ?", [updatedDriver, id]);
        res.json({ updated: true, message: "Conductor actualizado correctamente" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

driverRouter.put("/update/address/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { driver_address } = req.body;

        if (!driver_address) {
            return res.status(400).json({ message: "La dirección es requerida" });
        }

        const [rows] = await pool.query("SELECT * FROM driver WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Conductor no encontrado" });
        }

        await pool.query("UPDATE driver SET driver_address = ? WHERE id = ?", [driver_address, id]);
        res.json({ updated: true, message: "Dirección del conductor actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

driverRouter.delete("/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query("DELETE FROM driver WHERE id = ?", [id]);
        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

driverRouter.delete("/delete/email/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const result = await pool.query("DELETE FROM driver WHERE driver_email = ?", [email]);
        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default driverRouter;
