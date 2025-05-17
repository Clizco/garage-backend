import { Router } from "express";
import { pool } from "../../db.js";

const shipmentRouter = Router();

// Middleware para registrar la IP
shipmentRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// Obtener todos los envíos
shipmentRouter.get("/shipments/all", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM shipment");
        console.log("Envíos obtenidos:", rows);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener envíos:", error);
        return res.status(500).json({ error: 'Error al obtener envíos' });
    }
});

shipmentRouter.get("/shipments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM shipment WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Envío no encontrado" });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener el envío:", error);
        return res.status(500).json({ error: 'Error al obtener el envío' });
    }
});

shipmentRouter.get("/shipments/user/:user", async (req, res) => {
    try {
        const { user } = req.params;
        const [rows] = await pool.query("SELECT * FROM shipment WHERE shipment_user = ?", [user]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron envíos para este usuario" });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener envíos por usuario:", error);
        return res.status(500).json({ error: 'Error al obtener envíos por usuario' });
    }
});

shipmentRouter.get("/shipments/assigned/:user_email", async (req, res) => {
    try {
        const { user_email } = req.params;
        const [rows] = await pool.query("SELECT * FROM shipment WHERE shipment_assigned_user = ?", [user_email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron envíos asignados a este usuario" });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener envíos asignados por usuario:", error);
        return res.status(500).json({ error: 'Error al obtener envíos asignados por usuario' });
    }
}
);
    
shipmentRouter.get("/shipments/recieved/:user_email", async (req, res) => {
   try {
        const { user_email } = req.params;
        const [rows] = await pool.query("SELECT * FROM shipment WHERE shipment_assigned_user", [user_email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron envíos recibidos por este usuario" });
        }
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error("Error al obtener envíos recibidos por usuario:", error);
        return res.status(500).json({ error: 'Error al obtener envíos recibidos por usuario' });
    }
}
);

shipmentRouter.get("/shipments/province/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM shipment WHERE shipment_destination = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron envíos para esta provincia" });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener envíos por provincia:", error);
        return res.status(500).json({ error: 'Error al obtener envíos por provincia' });
    }
});


shipmentRouter.post("/shipments/create", async (req, res) => {
    try {
      const {
        shipment_status,
        shipment_origin,
        shipment_destination,
        shipment_sender_name,
        shipment_sender_phonenumber,
        shipment_receiver_name,
        shipment_receiver_phonenumber,
        shipment_description,
        shipment_code,
        shipment_assigned_user,
        shipment_user
      } = req.body;
  
      // Validar campos requeridos
      if (
        !shipment_status ||
        !shipment_origin ||
        !shipment_destination ||
        !shipment_sender_name ||
        !shipment_sender_phonenumber ||
        !shipment_receiver_name ||
        !shipment_receiver_phonenumber ||
        !shipment_description ||
        !shipment_code ||
        !shipment_user
      ) {
        return res.status(400).json({
          error: "Por favor, proporciona todos los datos requeridos para el envío."
        });
      }
  
      const newShipment = {
        shipment_status,
        shipment_origin, // asegúrate de que tu tabla use este nombre y no `shipmet_orign`
        shipment_destination,
        shipment_sender_name,
        shipment_sender_phonenumber,
        shipment_receiver_name,
        shipment_receiver_phonenumber,
        shipment_description,
        shipment_code,
        shipment_assigned_user: shipment_assigned_user || null, // puede ser null
        shipment_user
      };
  
      const [result] = await pool.query("INSERT INTO shipment SET ?", [newShipment]);
  
      return res.status(200).json({
        message: "Envío creado exitosamente",
        shipmentId: result.insertId
      });
    } catch (error) {
      console.error("Error al crear envío:", error);
      return res.status(500).json({ error: "Error al crear envío" });
    }
  });
  

// Actualizar un envío
shipmentRouter.put("/update/:id", async (req, res) => {
    try {
        const { shipment_status, shipment_origin, shipment_destination, shipment_sender_name, shipment_sender_phonenumber, shipment_receiver_name, shipment_receiver_phonenumber, shipment_description, shipment_user } = req.body;
        const { id } = req.params;

        if (!shipment_status || !shipment_origin || !shipment_destination || !shipment_sender_name || !shipment_sender_phonenumber || !shipment_receiver_name || !shipment_receiver_phonenumber || !shipment_description || !shipment_user) {
            return res.status(400).send("Por favor, proporciona todos los datos requeridos para actualizar el envío.");
        }

        const updatedShipment = { shipment_status, shipment_origin, shipment_destination, shipment_sender_name, shipment_sender_phonenumber, shipment_receiver_name, shipment_receiver_phonenumber, shipment_description, shipment_user };
        await pool.query("UPDATE shipment SET ? WHERE id = ?", [updatedShipment, id]);

        return res.status(200).json({ message: "Envío actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar envío:", error);
        return res.status(500).json({ error: 'Error al actualizar envío' });
    }
});

// Eliminar un envío
shipmentRouter.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM shipment WHERE id = ?", [id]);
        return res.status(200).json({ message: "Envío eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar envío:", error);
        return res.status(500).json({ error: 'Error al eliminar envío' });
    }
});

export default shipmentRouter;
