import { Router } from "express";
import { validateCreate } from "../../validators/users.js";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js";
import bcrypt from "bcrypt";
import { jwtDecode } from "jwt-decode";

const userRouter = Router();

userRouter.use((req, res, next) => {
  console.log(req.ip);
  next();
});

// Obtener usuario por email
userRouter.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [results] = await pool.query("SELECT * FROM users WHERE user_email = ?", [email]);
    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener todos los usuarios
userRouter.get("/users/all", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener usuario por ID
userRouter.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return results.length > 0
      ? res.status(200).json(results[0])
      : res.status(404).json({ message: "Usuario no encontrado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Crear usuario
userRouter.post("/signup", validateCreate, async (req, res) => {
  try {
    const {
      user_firstname,
      user_lastname,
      user_email,
      user_password,
      user_phonenumber,
      user_unique_id,
      role_id
    } = req.body;

    if (!user_email || !user_password) {
      return res.status(400).send("Faltan datos requeridos");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user_password, salt);

    const newUser = {
      user_firstname,
      user_lastname,
      user_email,
      user_password: hash,
      user_phonenumber,
      user_unique_id,
      role_id
    };

    const [result] = await pool.query("INSERT INTO users SET ?", [newUser]);

    const token = jwt.sign({ id: result.insertId }, config.secret, {
      expiresIn: 60 * 60 * 24
    });

    res.status(201).json({
      auth: true,
      result,
      token
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("user_email")) {
        return res.status(400).json({ message: "Este correo ya está registrado." });
      }
      if (error.message.includes("user_phonenumber")) {
        return res.status(400).json({ message: "Este número ya está registrado." });
      }
      if (error.message.includes("user_unique_id")) {
        return res.status(400).json({ message: "Este ID ya está registrado." });
      }
      return res.status(400).json({ message: "El dato ya está registrado." });
    }
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Login
userRouter.post("/signin", async (req, res) => {
  try {
    const { user_email, user_password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE user_email = ?", [user_email]);
    const user = users[0];

    if (!user_email || !user_password) {
      return res.status(401).send("Faltan datos de inicio de sesión");
    }
    if (!user) {
      return res.status(401).send("El usuario no está registrado");
    }

    const valid = bcrypt.compareSync(user_password, user.user_password);
    if (!valid) {
      return res.status(401).send({ auth: false, message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user.id, email: user.user_email }, config.secret, {
      expiresIn: 60 * 60 * 24
    });

    const decode = jwtDecode(token);
    res.json({ auth: true, message: `Bienvenido ${user_email}`, token, decode });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

// Obtener usuario desde token
userRouter.get("/user/token", async (req, res) => {
  const token = req.headers["x-access-token"];
  if (!token) return res.status(401).json({ auth: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, config.secret);
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

    const user = rows[0];
    delete user.user_password;

    res.json(user);
  } catch (err) {
    res.status(500).json({ auth: false, message: "Token inválido" });
  }
});

// Actualizar usuario
userRouter.put("/users/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_firstname,
      user_lastname,
      user_email,
      user_phonenumber,
      role_id
    } = req.body;

    const [result] = await pool.query(
      `UPDATE users SET 
        user_firstname = ?, 
        user_lastname = ?, 
        user_email = ?, 
        user_phonenumber = ?, 
        role_id = ?
      WHERE id = ?`,
      [user_firstname, user_lastname, user_email, user_phonenumber, role_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Obtener rol
userRouter.get("/users/role/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT roles.role_name 
       FROM users 
       JOIN roles ON users.role_id = roles.id 
       WHERE users.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const userRole = rows[0].role_name;
    if (["admin", "user", "guard", "driver", "coordinator"].includes(userRole)) {
      return res.status(200).json({ message: 'Acceso permitido', role: userRole });
    }

    return res.status(403).json({ error: 'Acceso denegado' });
  } catch (error) {
    console.error("Error al obtener el rol:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario por ID
userRouter.delete("/delete/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Eliminar usuario por email
userRouter.delete("/delete/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query("DELETE FROM users WHERE user_email = ?", [email]);
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

export default userRouter;
