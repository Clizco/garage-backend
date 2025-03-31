import express from "express";
import { port } from "./config.js";
import expressApp from "./app.js"; // Asegúrate de que esto también esté bien definido

// Servir archivos estáticos desde la carpeta "public"
expressApp.use(express.static('public'));

// Escuchar en el puerto definido
expressApp.listen(port, () => {
    console.log(`🚀 Servidor levantado en puerto ${port}`);
});
